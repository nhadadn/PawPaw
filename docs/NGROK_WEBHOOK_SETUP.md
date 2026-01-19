# ngrok y Webhook Setup - PAW PAW TORREÓN

## ✅ Estado Final

**ngrok URL:** `https://maryln-wersh-amal.ngrok-free.dev`
**Backend Local:** http://localhost:4000
**Stripe Webhook Endpoint:** `https://maryln-wersh-amal.ngrok-free.dev/api/webhooks/stripe`
**Swagger/OpenAPI:** http://localhost:4000/api/docs

## ✅ Configuración Completada

✅ ngrok auth token configurado
✅ Backend expuesto en URL pública
✅ Stripe webhook endpoint configurado
✅ STRIPE_WEBHOOK_SECRET actualizado en .env
✅ Backend reiniciado y validado
✅ Webhooks funcionales

## ✅ Validaciones Ejecutadas

✅ curl `https://maryln-wersh-amal.ngrok-free.dev/api/seed-status` → 200 OK
✅ curl http://localhost:4000/api/seed-status → 200 OK
✅ Stripe Dashboard → Endpoint is working
✅ ngrok Web Interface → http://127.0.0.1:4040
✅ Backend logs → Sin errores críticos
✅ Webhook endpoint → Responde correctamente (400 Bad Request en test manual, lo cual es correcto)

## 📊 Datos de Prueba Cargados

- Categorías: 4
- Productos: 6
- Variantes: 15
- Usuarios: 2

## 🚀 Próximos Pasos

1. Proceder con QA COMPLETO
2. Probar flujo de checkout end-to-end
3. Validar webhooks de Stripe en tiempo real
4. Ejecutar tests automatizados

## ⚠️ Notas Importantes

- **ngrok URL:** `https://maryln-wersh-amal.ngrok-free.dev` (NO cambiar mientras esté corriendo)
- **Mantener ngrok corriendo:** En terminal separada durante QA
- **Si ngrok se reinicia:** La URL cambia, hay que actualizar webhook en Stripe
- **Auth token:** Guardado en `C:\Users\nadir\AppData\Local/ngrok/ngrok.yml` (NO subir a GitHub)
- **Webhook secret:** En `.env` (NO subir a GitHub)

## 🔍 Monitoreo en Tiempo Real

Para ver webhooks en tiempo real:
```bash
# Abrir en navegador
http://127.0.0.1:4040

# O ver logs del backend
docker compose logs -f backend | grep -i webhook
```

## 📋 Checklist de Validación
- [x] ngrok instalado y configurado
- [x] Backend expuesto en URL pública
- [x] Webhook configurado en Stripe
- [x] STRIPE_WEBHOOK_SECRET en .env
- [x] Backend reiniciado
- [x] Datos de prueba cargados
- [x] Validaciones completadas
- [ ] QA COMPLETO (próximo paso)
