# 📦 Reporte de Análisis de Dependencias - QA Engineering

**Fecha:** 24/01/2026
**Responsable:** QA Lead
**Contexto:** Validación de dependencias tras implementación de Feature (Dark Mode)

---

## 1. Resumen Ejecutivo

Se ha realizado una auditoría completa de los archivos `package.json` en root, frontend y backend.
- **Estado de Seguridad:** ✅ **Seguro** (0 vulnerabilidades detectadas en auditoría).
- **Limpieza:** Se han corregido dependencias mal ubicadas y redundantes.
- **Compatibilidad:** ✅ Compatible con Node 18+ y plataformas Railway/Vercel.

---

## 2. Análisis de Nuevas Dependencias (Frontend - Dark Mode)

Basado en la implementación típica de Dark Mode y UI moderna, se validaron las siguientes librerías encontradas:

| Dependencia | Propósito | Estado | Análisis |
|-------------|-----------|--------|----------|
| `clsx` | Utilidad de clases condicionales | ✅ **Mantener** | Esencial para alternar clases `dark:` dinámicamente. Muy ligera (~234B). |
| `tailwind-merge` | Resolución de conflictos CSS | ✅ **Mantener** | Necesaria si se crean componentes UI reutilizables. Previene conflictos de estilos. |
| `lucide-react` | Iconografía | ✅ **Mantener** | Librería moderna y tree-shakeable. Mejor que importar librerías completas como FontAwesome. |
| `zustand` | Gestión de Estado | ✅ **Mantener** | Excelente elección. Mucho más ligera que Redux (~1.1kB) para manejar el estado del tema globalmente. |

---

## 3. Acciones de Optimización Realizadas

Como parte del proceso de QA ("Feel free to make changes"), se aplicaron las siguientes correcciones para mantener la higiene del código:

### 🧹 Limpieza en Backend (`backend/package.json`)
- **Problema:** Librerías de tipos (`@types/*`) estaban listadas como dependencias de producción.
- **Acción:** Se movieron a `devDependencies`.
- **Impacto:** Reduce la confusión y asegura que el build de producción solo instale lo necesario (aunque el compilador suele limpiarlo, es mejor práctica explícita).
  - Movidos: `@types/multer`, `@types/node-cron`, `@types/uuid`.

### 🧹 Limpieza en Root (`package.json`)
- **Problema:** Existían dependencias de frontend (`react-hook-form`, `@hookform/resolvers`) en la raíz del monorepo.
- **Acción:** Eliminadas (ya existen correctamente en `frontend/package.json`).
- **Impacto:** Evita conflictos de versiones y "hoisting" fantasma.

---

## 4. Recomendaciones y Compatibilidad

### 🚀 Despliegue (Railway / Vercel)

#### Frontend (Vercel)
- **Compatibilidad:** ✅ Total.
- **Configuración:** Vite genera estáticos en `dist`. Vercel lo detecta automáticamente.
- **Comando Build:** `npm run build` (ejecuta `tsc && vite build`).

#### Backend (Railway)
- **Compatibilidad:** ✅ Total (Node 18+).
- **Atención - `node-cron`:**
  - Esta librería requiere un servidor persistente.
  - **Railway:** Funciona correctamente (mantiene el proceso vivo).
  - **Vercel (Backend):** ❌ NO funcionaría en Vercel Functions (Serverless) porque los cron jobs requieren configuración externa (Vercel Cron) y no un proceso de Node persistente. **Mantener en Railway.**
- **Comando Start:** Asegurar que Railway apunte al directorio `backend` o que el comando de inicio en root haga `cd backend && npm start`.

### ⚖️ Performance & Bundle Size
- **`axios` (Frontend/Backend):**
  - **Observación:** Pesa ~11kB (min+gzip).
  - **Alternativa:** Considerar usar `fetch` nativo si no se usan interceptores complejos.
  - **Veredicto Actual:** Aceptable, pero revisar si se puede migrar a futuro para ahorrar peso en frontend.

---

## 5. Próximos Pasos Sugeridos
1. Ejecutar `npm install` en el directorio `frontend` para regenerar el `package-lock.json` (actualmente desincronizado).
2. Verificar que el script de `build` en root (`cd backend && ...`) sea el deseado para el despliegue principal, o configurar Railway para usar el subdirectorio `backend` como root.
