# Guía de Estilos para Modo Oscuro - PawPaw Chuy

Esta guía define los estándares de diseño y desarrollo para la implementación del modo oscuro en la plataforma, asegurando consistencia visual, accesibilidad (WCAG 2.1) y alineación con la estética "Luxury Streetwear".

## 1. Paleta de Colores

### Fondo (Backgrounds)
- **Principal**: `neutral-900` (#171923) - Usado para el cuerpo de la página.
- **Superficie**: `black` (#000000) o `neutral-900` con opacidad - Para tarjetas y contenedores.
- **Acento**: `accent` (#FACC15 - Gold) - Usado para elementos interactivos primarios y bordes activos.

### Tipografía (Typography)
Para garantizar la legibilidad y evitar el efecto "negro sobre negro":
- **Texto Principal**: `text-secondary` (#fff7ed) - Un blanco cálido que reduce la fatiga visual frente al blanco puro (#FFFFFF).
- **Texto en Fondos Claros**: `neutral-900` (#171923) - Usado **exclusivamente** sobre botones o badges de color de acento (Dorado/Blanco).
  - **Clase de utilidad**: `.text-on-light` (en `index.css`) fuerza el color negro incluso en modo oscuro.

### Sobrescritura Global
Se ha implementado una regla global en CSS que fuerza a todo texto oscuro (`text-neutral-900`, `text-black`, etc.) a convertirse en `text-secondary` cuando el modo oscuro está activo.
**Excepción**: Para usar texto negro sobre un fondo dorado/blanco en modo oscuro, se debe agregar la clase `.text-on-light`.

## 2. Componentes Interactivos (Botones)

### Botones de Selección (Tallas/Variantes)
Deben tener un estado activo de alto contraste y un estado inactivo sutil.

**Estado Activo (Seleccionado):**
- Fondo: `bg-accent` (Dorado)
- Texto: `text-on-light` (Negro #171923)
- Borde: `border-accent`
- Sombra: `shadow-md` o `shadow-glow`

**Estado Inactivo:**
- Fondo: Transparente
- Texto: `text-text-secondary` (#fff7ed)
- Borde: `border-neutral-700`
- Hover: `border-accent` y `text-accent`

### Botones Primarios
- Fondo: `bg-primary` (Dorado)
- Texto: `text-neutral-50` (Negro/Oscuro para contraste 4.5:1)
- Hover: `bg-primary-hover`

### Botones Outline
- Fondo: Transparente
- Borde: `border-neutral-700` (Inactivo) -> `border-accent` (Hover)
- Texto: `text-text-secondary` (Inactivo) -> `text-accent` (Hover)

## 3. Accesibilidad y Contraste

- **Ratio Mínimo**: 4.5:1 para texto normal, 3:1 para texto grande/bold.
- **Validación**:
  - Texto `#fff7ed` sobre Fondo `#171923`: Ratio ~15:1 (Pasa AAA).
  - Texto `#171923` sobre Fondo `#FACC15` (Gold): Ratio ~10:1 (Pasa AAA).

## 4. Implementación Técnica

### CSS Variables
```css
:root {
  --color-text-secondary: 255 247 237; /* #fff7ed */
}

/* Override Global para Modo Oscuro */
.dark .text-black,
.dark .text-neutral-900 {
  color: rgb(var(--color-text-secondary));
}

/* Clase de Escape para Texto Negro en Modo Oscuro */
.dark .text-on-light {
  color: rgb(23 25 35) !important;
}
```

### Ejemplo de Uso (React/Tailwind)

```tsx
<button
  className={cn(
    "border-2 transition-all",
    isActive 
      ? "dark:bg-accent dark:text-on-light dark:border-accent" 
      : "dark:text-text-secondary dark:border-neutral-700 dark:hover:border-accent"
  )}
>
  Opción
</button>
```
