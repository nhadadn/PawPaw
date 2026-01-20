# Reporte de Mejoras de Accesibilidad (WCAG AA)

## Resumen
Este documento detalla las mejoras de accesibilidad implementadas en el Frontend de Paw Paw Urban Show para cumplir con los estándares WCAG 2.1 Nivel AA.

## Violaciones Identificadas y Corregidas

### 1. Contraste de Color (Color Contrast)
**Problema:** Varios elementos de texto no cumplían con el ratio de contraste mínimo de 4.5:1 requerido para texto normal.
**Correcciones:**
- **Home.tsx:** Se ajustó el color de texto de `text-neutral-500` a `text-neutral-600` en descripciones de secciones.
- **ProductCard.tsx:** Se cambió `text-neutral-800` a `text-neutral-900` para títulos de productos.
- **Button.tsx:** Se actualizaron las variantes `primary` y `outline` para usar `text-neutral-900` y `text-orange-700` respectivamente, mejorando la legibilidad sobre fondos de color y bordes.
- **Badge.tsx:** Se cambió el color de texto de `white` a `neutral-900` en la variante `default` (fondo primario) para asegurar contraste suficiente.

### 2. Etiquetas Faltantes (Missing Labels)
**Problema:** Elementos interactivos (inputs, botones de íconos) carecían de etiquetas accesibles para lectores de pantalla.
**Correcciones:**
- **Header.tsx:** Se agregó `aria-label="Buscar"` al botón de búsqueda.
- **Footer.tsx:** Se agregaron `aria-label` descriptivos a los enlaces de redes sociales (Facebook, Instagram, Twitter).

### 3. Texto Alternativo (Missing Alt Text)
**Problema:** Imágenes sin descripción textual.
**Correcciones:**
- Se verificó que las imágenes de productos y banners incluyan atributos `alt` significativos.

## Validación
- **Herramienta:** `cypress-axe` (basado en axe-core).
- **Resultado:** 0 violaciones detectadas en la página de inicio.
- **Tests E2E:** 5/5 tests pasando, incluyendo el chequeo de accesibilidad dedicado (`Flow 0: Accessibility Check`).

## Recomendaciones Futuras
1. Mantener el uso de colores de la paleta `neutral-600` o superior para texto sobre fondo blanco.
2. Asegurar que todo nuevo componente interactivo incluya `aria-label` si no tiene texto visible.
3. Ejecutar auditorías de accesibilidad (`npm run test:e2e`) antes de cada deploy.
