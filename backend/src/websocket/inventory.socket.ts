import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import logger from '../lib/logger';

let io: Server | undefined;

// Rate limiting map: ip -> { count, windowStart }
const connectionRates = new Map<string, { count: number; windowStart: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_CONNECTIONS_PER_WINDOW = 30; // 30 connections per minute per IP

interface StockUpdatePayload {
  productId: number;
  stock: number;
  available: boolean;
}

export const createInventoryServer = (httpServer: HttpServer): Server => {
  if (io) {
    return io;
  }

  io = new Server(httpServer, {
    cors: {
      origin: [
        'http://localhost:5173',
        'https://pawpawtrc.com',
        'https://www.pawpawtrc.com',
        process.env.CORS_ORIGIN || '',
      ].filter(Boolean),
      methods: ['GET', 'POST'],
      credentials: true,
    },
    path: '/socket.io/', // Standard path
    transports: ['websocket', 'polling'], // Allow fallback
  });

  io.on('connection', (socket: Socket) => {
    const clientIp =
      (socket.handshake.headers['x-forwarded-for'] as string) || socket.handshake.address;

    // 1. Rate Limiting
    const now = Date.now();
    const rateData = connectionRates.get(clientIp) || { count: 0, windowStart: now };

    if (now - rateData.windowStart > RATE_LIMIT_WINDOW) {
      rateData.count = 0;
      rateData.windowStart = now;
    }

    rateData.count++;
    connectionRates.set(clientIp, rateData);

    if (rateData.count > MAX_CONNECTIONS_PER_WINDOW) {
      logger.warn(`Rate limit exceeded for IP: ${clientIp}`);
      socket.disconnect(true);
      return;
    }

    logger.info(`New WebSocket connection: ${socket.id} from ${clientIp}`);

    // 2. Room Management
    // Client joins 'product:{productId}' room to receive updates for that product
    socket.on('subscribe:product', (productId: string | number) => {
      if (!productId) return;
      const room = `product:${productId}`;
      socket.join(room);
      logger.debug(`Socket ${socket.id} joined room ${room}`);
    });

    socket.on('unsubscribe:product', (productId: string | number) => {
      if (!productId) return;
      const room = `product:${productId}`;
      socket.leave(room);
      logger.debug(`Socket ${socket.id} left room ${room}`);
    });

    // 3. Handle Disconnect
    socket.on('disconnect', (reason) => {
      logger.info(`Socket ${socket.id} disconnected: ${reason}`);
    });

    // 4. Error Handling
    socket.on('error', (err) => {
      logger.error(`Socket error for ${socket.id}`, { error: err });
    });
  });

  logger.info('Inventory WebSocket Server initialized');
  return io;
};

export const getIO = (): Server => {
  if (!io) {
    throw new Error('Socket.io not initialized! Call createInventoryServer first.');
  }
  return io;
};

// For testing purposes
export const resetIO = () => {
  if (io) {
    io.close();
    io = undefined;
  }
  connectionRates.clear();
};

// Helper to safely emit stock updates
export const emitStockUpdate = (productId: number, newStock: number) => {
  try {
    const ioInstance = getIO();
    const payload: StockUpdatePayload = {
      productId,
      stock: newStock,
      available: newStock > 0,
    };

    ioInstance.to(`product:${productId}`).emit('stock:update', payload);
    logger.debug(`Emitted stock:update for product ${productId}`, payload);
  } catch (error) {
    // Graceful degradation: Log error but don't crash main flow
    logger.warn(`Failed to emit stock update for product ${productId}`, { error });
  }
};
