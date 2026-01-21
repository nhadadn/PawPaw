# Guía de Despliegue - Paw Paw Urban Show

## 1. Variables de Entorno (Producción)

Crear un archivo `.env` en el servidor con las siguientes variables:

```env
# Backend
PORT=4000
NODE_ENV="production" # CRÍTICO: Si no es 'production', se usarán mocks para DB y Redis
DATABASE_URL="postgresql://user:password@host:5432/pawpaw_db?schema=public"
REDIS_URL="redis://host:6379"
USE_REAL_REDIS="true" # CRÍTICO: Requerido para usar Redis real en lugar de mock en memoria
JWT_SECRET="tu_secreto_super_seguro_produccion"
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
CORS_ORIGIN="https://pawpawurbanshow.com"

# Frontend (al construir)
VITE_API_URL="https://api.pawpawurbanshow.com"
VITE_STRIPE_PUBLIC_KEY="pk_live_..."
```

## 2. Construcción y Ejecución

### Backend
```bash
cd backend
npm ci --only=production
npm run build
# Ejecutar migraciones
npx prisma migrate deploy
# Iniciar con PM2 (recomendado)
pm2 start dist/index.js --name "pawpaw-api"
```

### Frontend
```bash
cd frontend
npm ci
npm run build
# Servir la carpeta 'dist' con Nginx o Apache
```

## 3. Verificación y Monitoreo

- **Health Check:** El endpoint `GET /health` devuelve `200 OK` si la DB y Redis están conectados.
- **Logs:** Se encuentran en `backend/logs/` (si se usa Winston con archivo) o vía `pm2 logs`.
- **Métricas:** El backend expone métricas de Prometheus en `/metrics`.

## 4. Backups

Configurar un cron job diario para la base de datos:
```bash
0 3 * * * PGPASSWORD=tu_password pg_dump -h host -U user pawpaw_db > /backups/pawpaw_db_$(date +\%F).sql
```

## 5. Recuperación ante Desastres
1. Restaurar DB: `psql -d pawpaw_db -f backup.sql`
2. Reiniciar contenedores/servicios.

## 6. Troubleshooting / Modo Desarrollo
- Si `NODE_ENV` no es `production`, Prisma usará un cliente Mock en memoria.
- Si `USE_REAL_REDIS` no es `true`, Redis usará una implementación Mock en memoria.
- Asegúrate de que las variables de entorno estén cargadas correctamente antes de iniciar el proceso.
