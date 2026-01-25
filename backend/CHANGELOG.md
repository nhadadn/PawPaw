# Backend Changelog

Este archivo documenta los cambios técnicos específicos del Backend, incluyendo APIs, servicios, y configuraciones de infraestructura.

---

## [2.2.0] - 2026-01-25

### 🚀 Features (Nuevas Funcionalidades)

#### WebSocket Real-time Inventory
*   **Documentación:** Agregada guía técnica en `WEBSOCKET_DOCS.md`.
*   **Arquitectura:** Implementación de Socket.IO para actualizaciones de stock en tiempo real.
*   **Eventos:**
    *   `subscribe:product`: Cliente se suscribe a cambios de un producto.
    *   `stock:update`: Servidor emite nuevo stock disponible.
*   **Seguridad:** Rate limiting por IP (30 conexiones/min) y desconexión automática.

#### Checkout Service Hardening
*   **Validación Estricta:** Verificación de tipos y rangos para `product_variant_id` y `quantity` en `checkout.service.ts`.
*   **Resolución de Usuarios:** Búsqueda automática de email para usuarios registrados si no se provee en el payload.
*   **Manejo de Errores:** Excepciones tipadas (`CheckoutError`) con códigos de error específicos (`ACTIVE_RESERVATION_EXISTS`, `INVALID_REQUEST`).

### 🔧 Fixes & Improvements

#### CI/CD Stability
*   **Mocking:** Actualización de mocks para Redis y Prisma en tests de integración (`shop.service.integration.test.ts`, etc.) para prevenir timeouts en CI.
*   **Teardown:** Implementación de limpieza de recursos (cierre de conexiones Redis/Database) after-tests para evitar "Handle Leaks".
*   **Coverage:** Corrección de tests de integración para `Admin`, `Images` y `RateLimit`.

#### Database
*   **Prisma:** Refinamiento de queries transaccionales para reservas de stock.

---
