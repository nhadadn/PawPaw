# API de Checkout

Este documento define los **contratos de API** para el flujo completo de checkout de Paw Paw Urban Show.

La API expuesta al frontend se servirá a través del gateway en los paths:

- `POST /api/checkout/reserve`
- `POST /api/checkout/confirm`
- `POST /api/checkout/cancel`

Internamente estos endpoints son atendidos por el servicio de Checkout, pero este documento se mantiene **agnóstico de implementación**.

---

## Convenciones Globales

- **Autenticación:**
  - Header obligatorio: `Authorization: Bearer <jwt>`
  - El JWT es emitido por Directus y validado en el gateway.
- **Idempotencia:**
  - Header opcional pero recomendado en operaciones mutadoras:
    - `Idempotency-Key: <uuid>`
  - Semántica: misma key = misma operación lógica; la respuesta se reutiliza hasta 24h.
- **Formato de contenido:**
  - `Content-Type: application/json; charset=utf-8`
- **Formato de error estándar:**
  - Cuerpo JSON:

    ```json
    {
      "error": "ERROR_CODE",
      "message": "Descripción legible para cliente/frontend",
      "details": { "campo": "detalle opcional" }
    }
    ```

---

## 1. POST /api/checkout/reserve

Reserva stock de productos para el usuario autenticado y calcula el total del carrito.

- **Método:** `POST`
- **Path público:** `/api/checkout/reserve`

### Headers

- `Authorization: Bearer <jwt>` (obligatorio)
- `Idempotency-Key: <uuid>` (muy recomendado)
- `Content-Type: application/json`

### Request Body

```json
{
  "items": [
    {
      "product_variant_id": 1,
      "quantity": 2
    }
  ]
}
```

#### Reglas de validación

- `items` es un array no vacío.
- Cada item debe cumplir:
  - `product_variant_id`: entero positivo.
  - `quantity`: entero positivo.
- La API deberá aplicar reglas de negocio adicionales:
  - `MAX_PER_CUSTOMER`: no exceder el límite por producto/variant e.
  - `available_stock` suficiente en `product_variants`.

### Respuesta 201 – Reserva creada

```json
{
  "reservation_id": "84c2b3f4-3f67-4b1a-9a77-6f2e5e1d9a10",
  "expires_at": "2026-01-18T12:34:56.000Z",
  "items": [
    {
      "product_variant_id": 1,
      "quantity": 2,
      "unit_price_cents": 89900,
      "total_price_cents": 179800,
      "currency": "MXN"
    }
  ],
  "total_cents": 179800,
  "currency": "MXN"
}
```

- `reservation_id`: identificador único de la reserva.
- `expires_at`: fecha/hora de expiración (TTL 10 minutos).
- `items`: eco del carrito con precios calculados.
- `total_cents`: suma de los `total_price_cents`.

### Respuesta 400 – Request inválido

```json
{
  "error": "INVALID_REQUEST",
  "message": "El formato de items es inválido"
}
```

Casos típicos:
- `items` vacío o ausente.
- Tipos inválidos en `product_variant_id` o `quantity`.

### Respuesta 401 – No autenticado

```json
{
  "error": "UNAUTHENTICATED",
  "message": "Token de autenticación requerido"
}
```

### Respuesta 409 – Conflictos de negocio

```json
{
  "error": "INSUFFICIENT_STOCK",
  "message": "No hay stock suficiente para uno o más items"
}
```

```json
{
  "error": "ACTIVE_RESERVATION_EXISTS",
  "message": "El usuario ya tiene una reserva activa"
}
```

```json
{
  "error": "MAX_PER_CUSTOMER_EXCEEDED",
  "message": "Se excede el máximo permitido por cliente para este producto"
}
```

### Respuesta 500 – Error interno

```json
{
  "error": "INTERNAL_ERROR",
  "message": "Ocurrió un error inesperado"
}
```

---

## 2. POST /api/checkout/confirm

Confirma el pago de una reserva existente y genera la orden final.

- **Método:** `POST`
- **Path público:** `/api/checkout/confirm`

### Headers

- `Authorization: Bearer <jwt>` (obligatorio)
- `Idempotency-Key: <uuid>` (recomendado para evitar órdenes duplicadas)
- `Content-Type: application/json`

### Request Body

```json
{
  "reservation_id": "84c2b3f4-3f67-4b1a-9a77-6f2e5e1d9a10",
  "payment_intent_id": "pi_3P..."
}
```

#### Reglas de validación

- `reservation_id`: UUID de una reserva existente.
- `payment_intent_id`: identificador de PaymentIntent creado previamente en Stripe.

### Respuesta 200 – Orden confirmada

```json
{
  "order_id": 1234,
  "order_number": "PP-2026-000123",
  "status": "paid",
  "total_cents": 179800,
  "currency": "MXN",
  "reservation_id": "84c2b3f4-3f67-4b1a-9a77-6f2e5e1d9a10"
}
```

- `order_number`: identificador amigable para mostrar al usuario.
- `status`: típicamente `paid` en caso de éxito.

### Respuesta 401 – No autenticado

```json
{
  "error": "UNAUTHENTICATED",
  "message": "Token de autenticación requerido"
}
```

### Respuesta 404 – Reserva no encontrada o expirada

```json
{
  "error": "RESERVATION_EXPIRED",
  "message": "La reserva ha expirado, se liberó el stock"
}
```

```json
{
  "error": "RESERVATION_NOT_FOUND",
  "message": "La reserva no existe o ya fue usada"
}
```

### Respuesta 402 – Pago fallido

```json
{
  "error": "PAYMENT_FAILED",
  "message": "Stripe rechazó el pago",
  "stock_released": true
}
```

- `stock_released` indica si el sistema liberó inmediatamente la reserva.

### Respuesta 409 – Conflictos de negocio

Ejemplos:

```json
{
  "error": "ORDER_ALREADY_CONFIRMED",
  "message": "Esta reserva ya fue utilizada para una orden"
}
```

```json
{
  "error": "RESERVATION_USER_MISMATCH",
  "message": "La reserva pertenece a otro usuario"
}
```

### Respuesta 500 – Error interno

```json
{
  "error": "INTERNAL_ERROR",
  "message": "Ocurrió un error inesperado"
}
```

---

## 3. POST /api/checkout/cancel

Cancela una reserva activa y libera el stock asociado.

- **Método:** `POST`
- **Path público:** `/api/checkout/cancel`

### Headers

- `Authorization: Bearer <jwt>` (obligatorio)
- `Content-Type: application/json`

### Request Body

```json
{
  "reservation_id": "84c2b3f4-3f67-4b1a-9a77-6f2e5e1d9a10"
}
```

#### Reglas de validación

- `reservation_id` debe existir y pertenecer al usuario autenticado.

### Respuesta 200 – Reserva cancelada

```json
{
  "status": "cancelled",
  "stock_released": true,
  "reservation_id": "84c2b3f4-3f67-4b1a-9a77-6f2e5e1d9a10"
}
```

### Respuesta 401 – No autenticado

```json
{
  "error": "UNAUTHENTICATED",
  "message": "Token de autenticación requerido"
}
```

### Respuesta 403 – Reserva de otro usuario

```json
{
  "error": "RESERVATION_USER_MISMATCH",
  "message": "La reserva pertenece a otro usuario"
}
```

### Respuesta 404 – Reserva no encontrada

```json
{
  "error": "RESERVATION_NOT_FOUND",
  "message": "La reserva no existe o ya fue cancelada"
}
```

### Respuesta 500 – Error interno

```json
{
  "error": "INTERNAL_ERROR",
  "message": "Ocurrió un error inesperado"
}
```

