# Release Notes v2.1.2 - Frontend Persistence & Stability Improvements
**Fecha:** 2026-01-25
**Versión:** 2.1.2

Esta versión introduce mejoras críticas en la estabilidad del flujo de compra (Checkout), gestión de imágenes y notificaciones del sistema. El foco principal ha sido la **persistencia del estado** para prevenir pérdida de datos durante la navegación y correcciones en la validación de stock.

---

## 🚀 Nuevas Características (Features)

### 1. Persistencia de Checkout y Recuperación de Sesión
Se ha implementado un sistema robusto para mantener el estado del usuario durante el proceso de compra, incluso si recarga la página.

*   **Persistencia en Cliente:**
    *   Uso de `localStorage` (vía Zustand `persist` middleware) para guardar `reservationId`, `step` actual y datos del formulario.
    *   El store `checkoutStore` ahora sobrevive a recargas del navegador.

*   **Validación de Sesión:**
    *   Nuevo hook `useValidateReservation(id)` que verifica la validez de la reserva contra el backend al cargar la página.
    *   Si la reserva ha expirado (10 min TTL) o no existe, el sistema limpia automáticamente el estado local y redirige al usuario, evitando estados inconsistentes.

*   **Código Relevante:**
    *   `frontend/src/hooks/useCheckout.ts`: Hooks `useGetReservation` y `useValidateReservation`.
    *   `frontend/src/stores/checkoutStore.ts`: Configuración de persistencia.

### 2. Notificaciones por Correo (Backend)
Integración completa de `nodemailer` para el envío de confirmaciones de pedido.

*   **Servicio de Email:** Configurado para enviar correos transaccionales al confirmar una orden exitosa.
*   **Manejo de Errores:** El fallo en el envío de correos no bloquea la transacción de compra, pero se registra en los logs para reintento manual o auditoría.

---

## 🐛 Correcciones (Bug Fixes)

### 1. Gestión de Imágenes
Se resolvieron problemas críticos en la subida y visualización de imágenes para **Categorías** y Productos.

*   **Content-Type:** Se corrigió el manejo de headers `multipart/form-data` en las peticiones de subida.
*   **Upload de Categorías:** El controlador `admin.controller.ts` ahora procesa correctamente las imágenes asignadas a categorías, guardando la referencia en la base de datos y el archivo en el sistema de archivos local.

### 2. Validación de Stock en Checkout
Mejora en la lógica de validación previa a la reserva.

*   **Validación Atómica:** El backend ahora verifica el stock disponible *antes* de intentar crear la reserva, devolviendo errores `409 Conflict` claros si la cantidad solicitada excede el disponible.
*   **Feedback al Usuario:** El frontend captura estos errores y muestra mensajes específicos (ej. "Stock insuficiente para el producto X"), en lugar de errores genéricos.

### 3. TypeScript & Tests
*   Resolución de errores de compilación TS relacionados con tipos de `nodemailer`.
*   Mejora de mocks en `checkout.service.test.ts` para pruebas unitarias más fiables.

---

## 🛠 Detalles Técnicos para Desarrolladores

### Migración / Upgrade
No se requieren migraciones de base de datos para esta versión.

### Verificación
Para validar los cambios de persistencia:
1.  Añadir productos al carrito y proceder al checkout.
2.  En el paso de "Reserva", recargar la página (F5).
3.  **Resultado Esperado:** La aplicación debe mantenerse en el mismo paso y conservar el ID de reserva.
4.  Esperar 10 minutos (o invalidar reserva manualmente) y recargar.
5.  **Resultado Esperado:** Redirección al carrito con mensaje de expiración.

### Archivos Afectados
*   `frontend/src/hooks/useCheckout.ts`
*   `frontend/src/stores/checkoutStore.ts`
*   `backend/src/controllers/admin.controller.ts`
*   `backend/src/services/checkout.service.ts`
