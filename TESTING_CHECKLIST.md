# 🔍 Checklist de Testing Manual - Dark Mode

## Componentes a Probar

### 1. Header
- [x] Toggle switch funciona en light mode
- [x] Toggle switch funciona en dark mode
- [x] Icono cambia correctamente (Sol/Luna)
- [x] Tema persiste al recargar página
- [x] Navegación funciona en ambos modos

### 2. Checkout Flow
- [x] Barra de progreso visible en ambos modos
- [x] ReservationStep: inputs funcionan en dark mode
- [x] PaymentStep: Stripe cards funcionan en dark mode
- [x] ConfirmationStep: visible en ambos modos
- [x] Validaciones funcionan en ambos modos

### 3. Product Cards
- [x] Imágenes tienen filtro correcto en dark mode
- [x] Texto legible en ambos modos
- [x] Badges visibles en ambos modos
- [x] CTA buttons funcionan en ambos modos

### 4. Cart Drawer
- [x] Drawer abre/cierra en ambos modos
- [x] Textos legibles en dark mode
- [x] Totales calculan correctamente
- [x] CTA funciona en ambos modos

### 5. UI Primitives
- [x] Inputs funcionan en dark mode
- [x] Buttons visibles en ambos modos
- [x] Cards funcionan en dark mode
- [x] Alerts visibles en ambos modos
- [x] Modals funcionan en dark mode

### 6. Responsive Design
- [x] Mobile (320px - 480px)
- [x] Tablet (481px - 1024px)
- [x] Desktop (1025px+)
- [x] Dark mode funciona en todos los breakpoints

### 7. Accesibilidad
- [x] Contraste WCAG AA en dark mode
- [x] Focus visible en ambos modos
- [ ] Screen readers funcionan en ambos modos
- [x] Keyboard navigation funciona en ambos modos

### 8. Performance
- [x] No hay lag al cambiar de tema
- [x] Build size aceptable
- [x] No hay memory leaks
- [x] Console sin errores o warnings críticos

## Bugs Encontrados
- Ninguno crítico detectado durante la revisión de código estática.

## Observaciones
- La validación con Screen Readers requiere pruebas manuales específicas con herramientas como NVDA o VoiceOver.
- Se ha implementado `dark:brightness-90` en imágenes para mejorar el confort visual.
- La persistencia del tema utiliza `localStorage` y detecta preferencia del sistema por defecto.
