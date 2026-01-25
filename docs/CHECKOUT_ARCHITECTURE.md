# Arquitectura de Checkout

Este documento describe la arquitectura del **flujo completo de checkout** en Paw Paw Urban Show, incluyendo reserva de stock, integración con Stripe, confirmación/cancelación de pedidos e infraestructura de limpieza de reservas expiradas.

Se asume el contexto descrito en [ARCHITECTURE.md](./ARCHITECTURE.md) y el esquema de base de datos definido en [DATABASE_DESIGN.md](./DATABASE_DESIGN.md).

---

## 1. Flujo de Reserva

Objetivo: **reservar stock** para un carrito de productos durante una ventana limitada (10 minutos) garantizando consistencia y evitando overbooking.

### 1.1 Pasos de alto nivel

1. El usuario autenticado envía `POST /api/checkout/reserve` con el contenido del carrito.
2. El gateway valida el JWT y reenvía la petición al servicio de Checkout.
3. El servicio aplica idempotencia usando `Idempotency-Key` y Redis.
4. Se verifica que el usuario no tenga una reserva activa (`máx. 1 reserva`).
5. Se abre una transacción en PostgreSQL.
6. Para cada item del carrito:
   - Se lee la fila de `product_variants` con `SELECT ... FOR UPDATE`.
   - Se valida que `available_stock >= quantity`.
   - Se actualiza `reserved_stock = reserved_stock + quantity`.
7. Se inserta un registro en `inventory_logs` con `change_type = 'reserve'`.
8. Se confirma la transacción `COMMIT`.
9. Se registra la reserva en Redis con TTL de 10 minutos y un índice por expiración.
10. Se devuelve al cliente el `reservation_id`, `expires_at`, items y total calculado.

### 1.2 Pseudocódigo (híbrido)

El siguiente pseudocódigo describe el flujo principal, seguido de notas sobre edge cases.

```text
func checkout_reserve(request):
  assert_authentication(request.authorization)

  key = request.headers.get("Idempotency-Key")
  if key is not null:
    cached = redis.get("idempotency:" + key)
    if cached exists:
      return cached_response(cached)

  user_id = extract_user_id_from_token(request.authorization)

  if redis.exists("reservation:user:" + user_id):
    return error(409, "ACTIVE_RESERVATION_EXISTS")

  items = normalize_and_validate_items(request.body.items)
  if items is invalid or empty:
    return error(400, "INVALID_REQUEST")

  begin_transaction()

  for item in items:
    row = select_for_update_product_variant(item.product_variant_id)
    if row is null:
      rollback()
      return error(400, "PRODUCT_VARIANT_NOT_FOUND")

    if row.available_stock < item.quantity:
      rollback()
      return error(409, "INSUFFICIENT_STOCK")

    if exceeds_max_per_customer(user_id, row.product_id, item.quantity):
      rollback()
      return error(409, "MAX_PER_CUSTOMER_EXCEEDED")

    update_reserved_stock(row.id, +item.quantity)

  log_inventory_reserve_items(items)

  commit_transaction()

  reservation_id = generate_uuid()
  expires_at = now() + 10_minutes

  reservation_payload = {
    id: reservation_id,
    user_id: user_id,
    items: items,
    expires_at: expires_at
  }

  redis.multi():
    set("reservation:" + reservation_id, reservation_payload, ttl=10_minutes)
    set("reservation:user:" + user_id, reservation_id, ttl=10_minutes)
    zadd("reservations:by_expiry", score=to_millis(expires_at), value=reservation_id)

  response = build_reserve_response(reservation_payload)

  if key is not null:
    cache_idempotent_response(key, response)

  return response
```

### 1.3 Edge cases relevantes

- **Reconexión / reintentos de red:**
  - El cliente debe reutilizar el mismo `Idempotency-Key` al reintentar.

## 2. Persistencia y Estado en Frontend (Nuevo en v2.1.2)

Para mejorar la experiencia de usuario y prevenir la pérdida de datos ante recargas de página, se implementó una estrategia de persistencia sincronizada.

### 2.1 Almacenamiento Local (Zustand Persist)
El `checkoutStore` utiliza el middleware `persist` para guardar en `localStorage`:
*   `reservationId`: ID de la reserva activa.
*   `activeStep`: Paso actual del wizard (Reserva, Pago, Confirmación).
*   `clientSecret`: Secreto de Stripe (si ya se generó).

### 2.2 Recuperación y Validación (Hydration)
Al cargar la aplicación (`CheckoutPage`):
1.  **Hydration:** Zustand recupera el estado desde `localStorage`.
2.  **Validación (`useValidateReservation`):**
    *   Si existe un `reservationId`, se consulta `GET /api/checkout/reservations/:id`.
    *   **Si es válido:** Se mantiene el estado y el usuario continúa donde se quedó.
    *   **Si expiró (404/Expired):** El hook limpia automáticamente el store (`clearCheckout()`) y redirige al carrito, notificando al usuario.

Este mecanismo garantiza que el estado visual del frontend nunca esté desincronizado con la validez real de la reserva en el backend (Redis).
  - La API devolverá la misma respuesta si la operación ya fue procesada.
- **Usuario intenta reservar mientras tiene una orden pendiente:**
  - Política recomendada: permitir nuevas reservas, pero el negocio puede decidir restringir.
- **Productos con stock altamente volátil:**
  - El uso de `SELECT FOR UPDATE` por fila limita las condiciones de carrera a nivel de fila.

---

## 2. Flujo de Confirmación (Stripe)

Objetivo: **convertir una reserva pagada en una orden confirmada**, garantizando consistencia entre Stripe y la base de datos.

### 2.1 Pasos de alto nivel

1. El usuario completa el pago en Stripe (cliente/SDK).
2. El frontend obtiene un `payment_intent_id` exitoso desde Stripe.
3. El frontend llama a `POST /api/checkout/confirm` con `reservation_id` y `payment_intent_id`.
4. El servicio de Checkout valida autenticación e idempotencia.
5. Se verifica que la reserva exista, pertenezca al usuario y no haya expirado.
6. Se consulta Stripe (`PaymentIntent.retrieve`) para confirmar el estado real del pago.
7. Si el pago **no es exitoso**:
   - Se libera el stock reservado y se registra en `inventory_logs` con `release_expired` o código equivalente.
   - Se eliminan las claves de reserva en Redis.
   - Se responde con `402 PAYMENT_FAILED` indicando si el stock fue liberado.
8. Si el pago **es exitoso**:
   - Se abre una transacción en PostgreSQL.
   - Se crea la fila en `orders` y sus correspondientes `order_items`.
   - Se ajusta el stock definitivo (decrementando la reserva).
   - Se registra en `inventory_logs` con `checkout_confirmed`.
   - Se confirma la transacción.
   - Se eliminan las claves de reserva en Redis y el índice de expiración.
   - Se responde con la información de la orden.
9. Independientemente de lo anterior, un webhook de Stripe puede llegar después y debe ser idempotente respecto a este flujo.

### 2.2 Pseudocódigo (híbrido)

```text
func checkout_confirm(request):
  assert_authentication(request.authorization)

  key = request.headers.get("Idempotency-Key")
  if key is not null:
    cached = redis.get("idempotency:" + key)
    if cached exists:
      return cached_response(cached)

  user_id = extract_user_id_from_token(request.authorization)

  reservation_id = request.body.reservation_id
  payment_intent_id = request.body.payment_intent_id

  reservation = redis.get("reservation:" + reservation_id)
  if reservation is null:
    return error(404, "RESERVATION_EXPIRED" or "RESERVATION_NOT_FOUND")

  if reservation.user_id != user_id:
    return error(409, "RESERVATION_USER_MISMATCH")

  if reservation.expires_at < now():
    release_reservation_in_db_and_redis(reservation)
    return error(404, "RESERVATION_EXPIRED")

  pi = stripe.retrieve_payment_intent(payment_intent_id)

  if not is_payment_successful(pi):
    release_reservation_in_db_and_redis(reservation)
    response = error(402, "PAYMENT_FAILED", { stock_released: true })
    if key is not null:
      cache_idempotent_response(key, response)
    return response

  begin_transaction()

  order_id = insert_order(user_id, reservation, pi)
  insert_order_items(order_id, reservation.items)
  apply_final_stock_adjustments(reservation.items)
  log_inventory_checkout_confirmed(reservation.items)

  commit_transaction()

  remove_reservation_from_redis(reservation)

  response = build_confirm_response(order_id, reservation)

  if key is not null:
    cache_idempotent_response(key, response)

  return response
```

### 2.3 Webhook de Stripe

El webhook de Stripe actúa como **fuente de verdad asíncrona** del estado del pago.

Objetivos:

- Manejar casos donde:
  - El frontend nunca llama a `confirm` pero el pago sí se completa.
  - El webhook llega antes o después de la llamada a `confirm`.

Pautas de diseño:

- El handler de webhook debe ser idempotente (usando el `id` del evento de Stripe).
- Si la orden ya está en estado `paid`, el webhook simplemente devuelve `200` sin cambios.
- Si la orden aún no existe pero el evento indica pago exitoso, se puede:
  - Crear la orden en segundo plano, o
  - Marcar un flag para reconciliación manual, según la política del negocio.

---

## 3. Cronjob de Limpieza de Reservas

Objetivo: evitar que las reservas de stock se queden colgadas y bloquear inventario innecesariamente.

### 3.1 Pasos de alto nivel

1. Cada 60 segundos, un proceso de fondo ejecuta un barrido de reservas expiradas.
2. Lee del sorted set `reservations:by_expiry` todas las reservas con `expires_at <= now`.
3. Para cada `reservation_id`:
   - Intenta leer `reservation:{id}` en Redis.
   - Si la key existe:
     - Libera el stock reservado en PostgreSQL.
     - Inserta registros en `inventory_logs` con `change_type = 'release_expired'`.
     - Borra las claves de reserva en Redis y el índice de expiración.
   - Si la key no existe:
     - Limpia el índice eliminando el `reservation_id` del sorted set.

### 3.2 Pseudocódigo (híbrido)

```text
func sweep_expired_reservations():
  now_ms = current_millis()

  ids = redis.zrange_by_score("reservations:by_expiry", 0, now_ms)
  if ids is empty:
    return

  for reservation_id in ids:
    payload = redis.get("reservation:" + reservation_id)

    if payload is null:
      redis.zrem("reservations:by_expiry", reservation_id)
      continue

    reservation = parse(payload)

    begin_transaction()

    for item in reservation.items:
      update_reserved_stock(item.product_variant_id, -item.quantity)
      log_inventory_release_expired(item.product_variant_id, item.quantity)

    commit_transaction()

    redis.multi():
      del("reservation:" + reservation_id)
      del("reservation:user:" + reservation.user_id)
      zrem("reservations:by_expiry", reservation_id)
```

---

## 4. Decisiones Arquitectónicas Clave

### 4.1 SELECT FOR UPDATE vs. Redlock

- Se utiliza **`SELECT ... FOR UPDATE`** sobre `product_variants` para garantizar exclusión a nivel de fila.
- Justificación para el MVP:
  - Simplicidad en comparación con un mecanismo de locking distribuido como Redlock.
  - Coherente con PostgreSQL como **única fuente de verdad** para el stock.
  - Reduce riesgos de inconsistencia entre DB y Redis.

### 4.2 TTL de Reserva (10 minutos)

- 10 minutos de ventana de reserva equilibran:
  - Tiempo suficiente para completar el pago (UX).
  - Minimizar el tiempo que el stock está bloqueado sin monetizarse.
- El valor es configurable y puede ajustarse tras medir comportamiento real.

### 4.3 Idempotencia (24h)

- Las respuestas idempotentes se guardan en Redis con TTL de 24h.
- Beneficios:
  - Evita órdenes duplicadas ante reintentos del cliente o del gateway.
  - Permite que reintentos tardíos sigan recuperando el mismo resultado.
- Consideraciones:
  - El cliente es responsable de no reutilizar la misma `Idempotency-Key` para operaciones distintas.

### 4.4 Manejo de errores y compensaciones

- Si falla la confirmación de pago:
  - Se libera el stock y se registra en `inventory_logs`.
- Si falla el cronjob temporalmente:
  - En el siguiente ciclo se vuelven a intentar reservas expiradas.
  - Como el TTL de Redis también expira las claves, el índice se va limpiando progresivamente.

---

## 5. Resumen para Backend

- Implementar los contratos de API definidos en [API_CHECKOUT.md](./API_CHECKOUT.md).
- Respetar los flujos y pseudocódigo descritos aquí, adaptándolos al stack elegido.
- Mantener las operaciones críticas de stock y órdenes **siempre dentro de transacciones** en PostgreSQL.
- Usar Redis exclusivamente como soporte para:
  - Idempotencia.
  - Reservas temporales (TTL) e índice de expiración.
  - No como fuente de verdad del inventario.

Con estos lineamientos, el equipo de backend tiene una guía clara para implementar un checkout **robusto, consistente e idempotente**, alineado con la arquitectura global del sistema.

