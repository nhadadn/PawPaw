# DevOps Integration - Admin Panel

## Arquitectura

Admin Panel integrado en infraestructura existente:
- **Backend APIs**: `/api/admin/*`
- **Frontend**: `/admin/*`
- **Nginx**: Reverse proxy configurado para manejar rutas de frontend y backend, incluyendo WebSocket para HMR en desarrollo.
- **CI/CD**: Pipeline actualizado con tests de backend, frontend, seguridad y E2E.

## Deployment

### Desarrollo

```bash
# Iniciar todos los servicios
docker-compose up -d

# Ver logs
docker-compose logs -f
```

### Producción

```bash
# Iniciar servicios de producción
docker-compose -f docker-compose.prod.yml up -d
```

## Monitoreo

- **Prometheus**: Recolección de métricas en `localhost:9090`
- **Grafana**: Visualización de métricas en `localhost:3000`
- **Loki + Promtail**: Agregación de logs.

## Seguridad

- **JWT Authentication**: Configurado para administradores.
- **Environment Variables**: Gestionadas vía `.env` y `.env.admin`.
- **Health Checks**: Implementados para Backend, Frontend, Redis y Postgres.
- **Security Headers**: Configurados en Nginx (HSTS, X-Frame-Options, etc.).

## Endpoints Clave

- Frontend: `http://localhost:5173`
- Backend Health: `http://localhost:4000/health`
- Admin Health: `http://localhost:4000/api/admin/dashboard/stats`
- API Docs: `http://localhost:4000/api-docs`

## Notas de Mantenimiento

- Para agregar nuevas variables de entorno de admin, editar `.env.admin` y reiniciar los contenedores.
- Los tests E2E se ejecutan automáticamente en GitHub Actions.
