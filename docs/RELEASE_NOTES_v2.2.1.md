# Release Notes v2.2.1 - Accessibility & CI Stability
**Fecha:** 2026-01-26
**Versión:** 2.2.1

Esta versión se centra exclusivamente en la **calidad del código**, **accesibilidad** y **estabilidad del pipeline de integración continua (CI)**. Se han resuelto múltiples deudas técnicas que bloqueaban el despliegue y afectaban la experiencia de usuarios con tecnologías de asistencia.

---

## 🐛 Correcciones y Mejoras (Fixes & Improvements)

### 1. Accesibilidad (A11y) ♿
Se realizó una auditoría y corrección masiva de problemas de accesibilidad en el frontend.

*   **Cumplimiento WCAG:** Se ajustaron componentes para pasar validaciones automáticas de accesibilidad.
*   **Mejoras Semánticas:**
    *   Etiquetas `aria-label` y roles correctos en componentes interactivos.
    *   Mejora en la estructura de encabezados y navegación.
    *   Corrección de contrastes de color para mejor legibilidad.
*   **Router Warnings:** Eliminación de advertencias de `react-router` que afectaban la consola y potencialmente la navegación asistida.

### 2. Integración Continua (CI/CD) ⚙️
El pipeline de CI se encontraba bloqueado por fallos en tests y violaciones de linter.

*   **Tests E2E:** Corrección de tests que fallaban por problemas de accesibilidad (cypress-axe).
*   **Vitest Config:** Ajustes en la configuración de pruebas unitarias para eliminar advertencias y falsos positivos.
*   **Unblock CI:** Los cambios aseguran que los PRs futuros pasen los checks automáticos (lint, test, build).

### 3. Estabilidad del Frontend
*   **ConfirmationStep Fix:** Se corrigió un bug crítico donde `items` podía ser `undefined` en el paso de confirmación, causando errores en tiempo de ejecución y fallos en CI.
    *   *Detalle:* Se agregó validación defensiva para manejar casos donde el estado del carrito no se ha hidratado completamente.

---

## 🛠 Detalles Técnicos

### Archivos Afectados
*   **Frontend Config:** `vitest.config.ts`
*   **Componentes:** Múltiples componentes de UI (`Header`, `Footer`, `ProductCard`, etc.) para fixes de A11y.
*   **Features:** `ConfirmationStep.tsx`
*   **Tests:** Archivos de prueba E2E y unitarios.

### Verificación
1.  **Accesibilidad:** Ejecutar auditoría Lighthouse o axe-core en las páginas principales. El score de accesibilidad debe haber mejorado significativamente (objetivo > 90).
2.  **CI Pipeline:** Verificar que el último run en GitHub Actions (o local) esté en verde (`npm run test`, `npm run lint`).
