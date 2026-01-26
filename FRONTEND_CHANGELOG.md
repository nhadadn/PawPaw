# 📘 Frontend Changelog & Technical Documentation

Este documento registra los cambios, mejoras y actualizaciones técnicas del proyecto **PawPawTRC**.

---

## v2.2.0: Product Experience & UI Enhancements
**Fecha:** 25 de Enero, 2026
**Enfoque:** Experiencia de Producto, Design System "Urbana Premium", Navegación Visual.

### 1. Design System: "Urbana Premium"
Se ha implementado una nueva identidad visual basada en variables CSS para facilitar el theming dinámico:
*   **Tipografía:**
    *   **Display:** `Space Grotesk` para títulos y encabezados de impacto.
    *   **Body:** `Inter` para legibilidad óptima en textos largos y UI.
*   **Paleta de Colores Semántica:**
    *   Uso extensivo de variables CSS (`--color-primary`, `--color-surface`, etc.) definidos en `index.css`.
    *   Soporte nativo para opacidad mediante `rgb(var(...) / <alpha>)`.
    *   Transiciones suaves de color (`duration-300`) en modo oscuro.

### 2. Nuevos Componentes UI
Se han introducido componentes interactivos para mejorar la visualización de productos:

#### A. Sistema de Zoom y Galería
*   **`ZoomImage`:**
    *   **Desktop:** Efecto de lente ("lens zoom") al pasar el cursor.
    *   **Mobile:** Modalidad "Tap-to-expand".
*   **`Lightbox`:**
    *   Visor a pantalla completa con fondo desenfocado.
    *   Navegación por teclado (`ArrowLeft`, `ArrowRight`, `Escape`).
*   **`ProductGallery`:**
    *   Integración de miniaturas con scroll automático.
    *   Navegación dual: Flechas (desktop) / Dots (mobile).

### 3. Checkout Experience 2.0
Mejoras significativas en la UX del proceso de compra (`CheckoutPage.tsx`):
*   **Sincronización de Estado:** El paso actual se refleja en la URL (`?step=1`) permitiendo navegación nativa del navegador.
*   **Validación de Pasos:** Guardas de navegación que impiden saltar a pagos/confirmación sin los datos previos requeridos.
*   **Progress Bar:** Indicador visual responsivo con estados: Activo (Primary), Completado (Success/Check) y Pendiente.

### 4. Mejoras de Accesibilidad
*   Implementación de etiquetas ARIA en controles de galería.
*   Gestión de foco en modales (Lightbox).

---

## v2.1.1: Optimización de Dependencias & QA
**Fecha:** 24 de Enero, 2026
**Enfoque:** Mantenimiento, Seguridad y Limpieza de Código.

### 🛡️ Seguridad y Calidad
*   **Auditoría de Dependencias:** Validación completa de `package.json` en root, frontend y backend.
    *   Resultado: **0 Vulnerabilidades** (npm audit clean).
    *   Acción: Eliminación de dependencias redundantes en root (`react-hook-form` movido a frontend).
    *   Acción: Corrección de dependencias de desarrollo en backend (tipos movidos a `devDependencies`).

### 📦 Validación de Stack (Dark Mode)
Se confirmó la idoneidad técnica de las librerías introducidas en v2.1.0:
*   **`clsx` + `tailwind-merge`:** Estándar aprobado para manejo de clases condicionales.
*   **`zustand`:** Aprobado como gestor de estado ligero (~1kB) para el tema global.
*   **`lucide-react`:** Aprobado por su bajo impacto en bundle size (Tree-shakable).

---

## v2.1.0: Frontend Overhaul & Dark Mode System
**Fecha:** 24 de Enero, 2026
**Enfoque:** UX/UI, Accesibilidad, Rediseño de Checkout.

### 1. Resumen Ejecutivo
Se completó una actualización mayor enfocada en dos pilares: **Implementación de Dark Mode** integral y **Rediseño del Checkout Flow**. Estas mejoras buscan modernizar la interfaz y asegurar accesibilidad (WCAG AA).

### 2. Análisis de Cambios en Código Fuente

#### A. Infraestructura y Configuración Global
| Archivo | Ruta Relativa | Descripción del Cambio |
| :--- | :--- | :--- |
| `tailwind.config.js` | `/frontend/tailwind.config.js` | Habilitado `darkMode: 'class'`. Extendida paleta `neutral`. |
| `ThemeProvider.tsx` | `/frontend/src/providers/` | **(Nuevo)** Contexto global con persistencia en `localStorage`. |
| `main.tsx` | `/frontend/src/main.tsx` | Integración del `ThemeProvider` en la raíz. |

#### B. Flujo de Checkout (Rediseño)
| Archivo | Ruta Relativa | Descripción del Cambio |
| :--- | :--- | :--- |
| `CheckoutPage.tsx` | `/frontend/src/features/checkout/` | Layout responsivo, barra de progreso animada. |
| `PaymentStep.tsx` | `/frontend/src/features/checkout/` | Integración Stripe Elements con estilos dinámicos. |

#### C. Componentes UI & Navegación
*   **Header:** Agregado Toggle Switch (Sol/Luna).
*   **CartDrawer:** Panel lateral oscuro, textos ajustados.
*   **ProductCard:** Filtro `brightness-90` en imágenes para modo oscuro.
*   **UI Primitives:** Adaptación de `Input`, `Button`, `Card` a paleta oscura.

### 3. Documentación Funcional (Dark Mode)
*   **Mecanismo:** Toggle manual + Detección de sistema.
*   **Persistencia:** Key `vite-ui-theme` en LocalStorage.
*   **Paleta:** Fondo `#0A0A0A`, Texto `#FAFAFA`, Acento `#FF6B35`.

### 4. Stack Tecnológico Actualizado
*   **Core:** React 18, TypeScript, Vite.
*   **Estilos:** Tailwind CSS v3.4.
*   **Estado:** Zustand (Global), React Context (Theme).
*   **Formularios:** React Hook Form, Zod.

---
*Generado automáticamente para documentación de proyecto.*
