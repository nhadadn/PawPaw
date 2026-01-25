# Gestión de Imágenes en PawPaw Chuy

Este documento detalla el flujo completo de gestión de imágenes en la aplicación, desde la captura en el frontend hasta el almacenamiento y recuperación en el backend. Sirve como guía de diagnóstico y referencia para el mantenimiento.

## 1. Análisis del Estado Actual

Actualmente, el sistema utiliza una estrategia de almacenamiento local en el servidor backend. Las imágenes se sirven como archivos estáticos a través de Express.

*   **Problema Reportado:** Las imágenes de los productos no se visualizaban correctamente.
*   **Diagnóstico:** El problema principal identificado es la **falta de ejecución del servidor backend** o su ejecución desde un directorio incorrecto, lo que impide que `express.static` localice la carpeta `uploads`. Además, es crítico que el backend se ejecute en el puerto esperado (`4000`) para que coincida con la configuración `VITE_API_URL` del frontend.
*   **Estado de Archivos:** Los archivos de imagen existen físicamente en la ruta `backend/uploads/products`.

## 2. Flujo de Datos Detallado

### A. Frontend (Captura y Envío)
1.  **Componente de Admin:** El administrador selecciona una imagen en el formulario de creación/edición de productos o **categorías**.
17→2.  **Envío:** La imagen se envía como parte de un `FormData` (multipart/form-data) al endpoint `POST /api/products` o `POST /api/categories`.
    *   Campo del formulario: `image` (según configuración de multer).

### B. Backend (Recepción y Procesamiento)
1.  **Middleware (`upload.middleware.ts`):**
    *   Intercepta la petición multipart.
    *   Valida que el archivo sea una imagen (`mimetype` empieza con `image/`).
    *   Genera un nombre único: `Date.now() + '-' + Math.round(Math.random() * 1e9) + extension`.
    *   **Almacenamiento:** Guarda el archivo físicamente en `backend/uploads/products`.
2.  **Controlador (`admin.controller.ts`):**
    *   Recibe la información del archivo guardado.
    *   Genera la URL relativa: `/uploads/products/<filename>`.
    *   Guarda esta referencia (string) en la base de datos (campo `imageUrl` del modelo `Product`).

### C. Frontend (Visualización)
1.  **Consumo:** El componente `ProductCard.tsx` recibe el objeto producto con `imageUrl`.
2.  **Transformación URL:** La función `getImageUrl` (en `lib/utils.ts`) convierte la ruta relativa en absoluta:
    *   Toma `VITE_API_URL` (ej. `http://localhost:4000`).
    *   Concatena con la ruta relativa: `http://localhost:4000/uploads/products/imagen.jpg`.
3.  **Renderizado:** Etiqueta `<img>` carga la URL absoluta.

### D. Almacenamiento Físico
*   **Ubicación:** Carpeta local en el servidor.
*   **Ruta:** `backend/uploads/products`.
*   **Servicio:** Express sirve esta carpeta estáticamente en la ruta `/uploads`.
    *   Configuración en `app.ts`: `app.use('/uploads', express.static(uploadDir))`.

## 3. Causa Raíz del Problema

La interrupción del flujo se debe a uno de los siguientes factores operativos:

1.  **Backend Detenido:** Si el servicio backend no está corriendo, el frontend no puede recuperar las imágenes (error de conexión).
2.  **Directorio de Ejecución Incorrecto (CWD):**
    *   El backend espera ejecutarse desde la carpeta `backend/`.
    *   Si se ejecuta desde la raíz del proyecto (`PawPawChuy/`) sin ajustar las rutas, `process.cwd()` apunta a la raíz, y `express.static` busca en `PawPawChuy/uploads` (que no existe o está vacía), en lugar de `PawPawChuy/backend/uploads`.
3.  **Puerto Incorrecto:** Si el backend no corre en el puerto 4000, no coincide con `VITE_API_URL`.

## 4. Requisitos Técnicos y Configuraciones

### Backend
*   **Puerto:** Debe ser `4000` (definido en `backend/.env`).
*   **Variables de Entorno:**
    *   `PORT=4000`
    *   `UPLOAD_DIR` (Opcional, por defecto es `process.cwd() + '/uploads'`).
*   **Permisos:** El proceso de Node.js debe tener permisos de lectura/escritura en la carpeta `uploads`.

### Frontend
*   **Variables de Entorno:**
    *   `VITE_API_URL=http://localhost:4000` (Debe coincidir con el puerto del backend).

## 5. Protocolo de Solución

Para restaurar la visualización de imágenes:

1.  **Verificar Archivos:** Confirmar que existen imágenes en `backend/uploads/products`.
2.  **Iniciar Backend Correctamente:**
    *   Abrir terminal.
    *   Navegar al directorio backend: `cd backend`.
    *   Ejecutar: `npm run dev`.
    *   *Verificar logs:* Debe decir "Serving static files from: .../backend/uploads".
3.  **Verificar Frontend:**
    *   Asegurar que `.env` tiene `VITE_API_URL=http://localhost:4000`.
    *   Reiniciar servidor de desarrollo frontend (`npm run dev` en carpeta frontend).

## 6. Procedimientos de Verificación

1.  **Prueba de Acceso Directo:**
    *   Navegar a `backend/uploads/products` y copiar el nombre de un archivo (ej. `foto.jpg`).
    *   Abrir navegador y visitar: `http://localhost:4000/uploads/products/foto.jpg`.
    *   *Resultado esperado:* La imagen debe cargar en el navegador.

2.  **Prueba de Aplicación:**
    *   Abrir la aplicación frontend (`http://localhost:5173`).
    *   Navegar al catálogo de productos.
    *   *Resultado esperado:* Las tarjetas de producto muestran las imágenes correctamente.
    *   Si falla, inspeccionar elemento (`F12`) -> Red -> Img, y verificar la URL de la petición (debe ser `http://localhost:4000/...`).
