# PawPaw Urban Show - Frontend

Este proyecto es la implementación del Frontend para el E-commerce de ropa urbana PawPaw. Está construido con React, TypeScript, Vite y Tailwind CSS.

## 🚀 Quick Start

1.  **Instalar dependencias:**
    ```bash
    npm install
    ```

2.  **Iniciar servidor de desarrollo:**
    ```bash
    npm run dev
    ```

3.  **Construir para producción:**
    ```bash
    npm run build
    ```

## 🎨 Design System

El sistema de diseño está configurado en `tailwind.config.js` y utiliza las siguientes variables principales:

-   **Primary Color:** `#FF6B35` (Naranja vibrante)
-   **Secondary Color:** `#004E89` (Azul profundo)
-   **Fonts:** `Space Grotesk` (Headings) y `Inter` (Body)

### Componentes Base (`src/components/ui`)

-   `Button`: Variantes primary, secondary, accent, outline, ghost. Soporta estados de carga e iconos.
-   `Input`: Campos de texto con validación y soporte para iconos.
-   `Card`: Contenedores para agrupar información.
-   `Badge`: Etiquetas de estado.
-   `Timer`: Contador regresivo para la expiración de reservas.
-   `Alert`: Mensajes de feedback (success, error, warning, info).
-   `Modal`: Ventanas modales accesibles.

## 🛒 Checkout Flow (`src/features/checkout`)

El flujo de checkout implementa la lógica crítica de negocio:

1.  **Reserva (`ReservationStep`):** Selección de items y llamada a `POST /reserve`. Inicia el timer de 10 minutos.
2.  **Pago (`PaymentStep`):** Formulario de pago (simulación de Stripe Elements). Valida que la reserva no haya expirado.
3.  **Confirmación (`ConfirmationStep`):** Mensaje de éxito tras `POST /confirm`.

## 📱 Responsividad

El diseño es Mobile-First. Los breakpoints principales son:
-   `sm`: 640px
-   `md`: 768px
-   `lg`: 1024px

## ♿ Accesibilidad

-   Contraste de colores verificado (WCAG AA).
-   Navegación por teclado soportada.
-   Etiquetas ARIA en componentes interactivos.
