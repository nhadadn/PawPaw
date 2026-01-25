# Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto se adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.2] - 2026-01-25

### 🚀 Added
- **Backend:** Integración de `nodemailer` para notificaciones por correo.
- **Checkout:** Persistencia del estado del checkout para mejorar la experiencia de usuario.

### 🐛 Fixed
- **Imágenes:** Corrección en la subida de imágenes de categorías y manejo de `Content-Type`.
- **Checkout:** Validación de stock mejorada y manejo de errores durante el proceso de compra.
- **Tests:** Mejoras en los mocks de pruebas y resolución de errores de TypeScript relacionados con `nodemailer`.
- **Documentación:** Actualización de documentación técnica relacionada con la gestión de imágenes.

## [2.1.1] - 2026-01-25

### 🚀 Added (Nuevo)

#### Frontend
- **Dark Mode System:** Implementación completa de tema oscuro con persistencia en `localStorage` y detección de preferencias del sistema.
- **Stripe Integration:** Flujo de pago seguro utilizando `Stripe Elements` en el paso de pago del checkout.
- **Admin Dashboard:**
  - Nuevas páginas para gestión de **Productos**, **Inventario** y **Órdenes**.
  - Componentes UI administrativos: `DataTable`, `MetricsCard`, `AdminSidebar`.
  - Autenticación protegida para rutas `/admin`.
- **UI Components:** Nuevos componentes base `Timer` (para reservas), `Badge`, `Modal` y mejoras en `Card` y `Button` para soporte de temas.

#### Backend
- **Admin API:** Endpoints RESTful para gestión completa del e-commerce:
  - `GET/POST /api/admin/products`: Gestión de catálogo.
  - `GET /api/admin/orders`: Visualización de pedidos.
  - `GET /api/admin/dashboard/stats`: Métricas de negocio.
- **Checkout Service:** Lógica de negocio robusta para reservas de stock atómicas y confirmación de pagos.
- **Testing Suite:**
  - Tests de integración exhaustivos en `src/integration/` cubriendo Checkout, Admin, Imágenes y Manejo de Errores.
  - Configuración de Jest optimizada con soporte para TypeScript.
- **Middleware:** Implementación de `adminAuthMiddleware` para seguridad basada en roles (RBAC).

#### Infraestructura
- **Docker:** Configuración completa en `docker-compose.yml` para servicios de soporte (PostgreSQL 15, Redis 7).
- **Scripts:** Scripts de utilidad para seed de base de datos (`npm run seed`) y migraciones.

### 🔄 Changed (Cambios)

#### Base de Datos (Prisma)
- **Enums:** Migración de campos de texto a Enums nativos de PostgreSQL para `UserRole`, `OrderStatus` y `InventoryChangeType` para mayor seguridad de tipos.
- **Guest Checkout:** Actualización del modelo `Order` para soportar compras de invitados (`guestEmail`, `guestName`).

#### Documentación
- **README:** Actualización mayor con instrucciones precisas de "Quick Start" y stack tecnológico actual (PERN).
- **Guías:** Creación de `docs/QA_READY.md` y `backend/ADMIN_IMPLEMENTATION.md` para referencia técnica.

### 🐛 Fixed (Correcciones)

- **Seguridad:** Auditoría de dependencias completada (0 vulnerabilidades reportadas en `npm audit`).
- **Tipos:** Corrección de definiciones de tipos TypeScript en el Frontend para coincidir con la nueva API del Backend.
- **Estabilidad:** Manejo de errores 404 y 400 estandarizado en el Backend.

---

## [2.1.0] - 2026-01-24

### Added
- Inicialización del proyecto con estructura Monorepo (Frontend + Backend).
- Configuración base de Vite + React para Frontend.
- Configuración base de Express + TypeScript para Backend.
- Setup inicial de Prisma y conexión a Base de Datos.
