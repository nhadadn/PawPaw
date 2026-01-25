import { useEffect, useState } from 'react';
import { getSocket } from '../lib/socket';

interface StockUpdatePayload {
  productId: number | string;
  stock: number;
  available: boolean;
}

export const useStockUpdates = (productId: number | string | undefined) => {
  const [stock, setStock] = useState<number | null>(null);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isConnected, setIsConnected] = useState(() => {
    const socket = getSocket();
    return socket.connected;
  });

  useEffect(() => {
    if (!productId) return;

    const socket = getSocket();
    const id = String(productId);

    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    const handleStockUpdate = (data: StockUpdatePayload) => {
      // Ensure the update is for the current product
      if (String(data.productId) === id) {
        setStock(data.stock);
        setIsAvailable(data.available);
      }
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('stock:update', handleStockUpdate);

    // Subscribe to product updates
    socket.emit('subscribe:product', id);

    return () => {
      socket.emit('unsubscribe:product', id);
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('stock:update', handleStockUpdate);
    };
  }, [productId]);

  return { stock, isAvailable, isConnected };
};
