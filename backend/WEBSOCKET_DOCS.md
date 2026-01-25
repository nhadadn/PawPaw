# Documentación de WebSocket - Actualización de Stock en Tiempo Real

## Arquitectura

El sistema utiliza **Socket.IO** para proporcionar actualizaciones de stock en tiempo real a los clientes conectados.

1.  **Servidor WebSocket (Backend)**:
    *   Integrado en el servidor HTTP principal (Express).
    *   Gestiona conexiones y salas (rooms) por producto.
    *   Implementa Rate Limiting por IP.
    *   Expone un Singleton `io` para ser usado por servicios.

2.  **Servicios (Backend)**:
    *   `CheckoutService` y `ExpirationScheduler` emiten eventos cuando el stock cambia (reserva confirmada, cancelada o expirada).

3.  **Cliente (Frontend)**:
    *   Hook `useStockUpdates` gestiona la conexión y suscripción.
    *   Se conecta automáticamente al cargar la página del producto.

## Eventos

### Cliente -> Servidor

| Evento | Payload | Descripción |
| :--- | :--- | :--- |
| `subscribe:product` | `productId: string` | Suscribe al socket a las actualizaciones de un producto específico. |
| `unsubscribe:product` | `productId: string` | Desuscribe al socket de las actualizaciones. |

### Servidor -> Cliente

| Evento | Payload | Descripción |
| :--- | :--- | :--- |
| `stock:update` | `{ productId: number, stock: number, available: boolean }` | Emitido cuando cambia el stock de un producto suscrito. |

## Guía de Integración Frontend

El hook `useStockUpdates` abstrae toda la complejidad.

```typescript
import { useStockUpdates } from '../hooks/useStockUpdates';

const ProductPage = ({ product }) => {
  const { stock, isAvailable, isConnected } = useStockUpdates(product.id);

  // Usa 'stock' si está definido (actualización en tiempo real), 
  // de lo contrario usa el stock inicial del producto.
  const displayStock = stock !== null ? stock : product.stock;

  return (
    <div>
      <h1>{product.name}</h1>
      <p>Stock: {displayStock}</p>
      {isAvailable === false && <span>Agotado</span>}
    </div>
  );
};
```

## Configuración de Rate Limiting

*   **Ventana**: 1 minuto.
*   **Límite**: 30 conexiones por IP.
*   **Acción**: Desconexión forzada si se excede el límite.

## Seguridad

*   **CORS**: Configurado para permitir orígenes de confianza.
*   **Validación**: Los inputs de eventos se validan (básicamente) antes de procesar.
