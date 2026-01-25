import { createServer, Server as HttpServer } from 'http';
import { AddressInfo } from 'net';
import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import { Server } from 'socket.io';
import { createInventoryServer, resetIO, emitStockUpdate } from './inventory.socket';

describe('Inventory WebSocket Server', () => {
  let httpServer: HttpServer;
  let io: Server;
  let clientSocket: ClientSocket;
  let port: number;

  beforeAll((done) => {
    httpServer = createServer();
    io = createInventoryServer(httpServer);

    httpServer.listen(() => {
      const address = httpServer.address() as AddressInfo;
      port = address.port;
      done();
    });
  });

  afterAll((done) => {
    io.close();
    httpServer.close();
    resetIO();
    done();
  });

  beforeEach((done) => {
    clientSocket = Client(`http://localhost:${port}`, {
      path: '/socket.io/',
      transports: ['websocket'],
    });
    clientSocket.on('connect', done);
  });

  afterEach(() => {
    if (clientSocket.connected) {
      clientSocket.disconnect();
    }
  });

  test('should allow client to subscribe to product updates', (done) => {
    const productId = '123';
    clientSocket.emit('subscribe:product', productId);

    // Allow some time for join to happen
    setTimeout(() => {
      const room = io.sockets.adapter.rooms.get(`product:${productId}`);
      expect(room).toBeDefined();
      expect(room?.size).toBe(1);
      done();
    }, 50);
  });

  test('should allow client to unsubscribe from product updates', (done) => {
    const productId = '456';
    clientSocket.emit('subscribe:product', productId);

    setTimeout(() => {
      clientSocket.emit('unsubscribe:product', productId);
      setTimeout(() => {
        const room = io.sockets.adapter.rooms.get(`product:${productId}`);
        expect(room).toBeUndefined();
        done();
      }, 50);
    }, 50);
  });

  test('should emit stock:update event to subscribed clients', (done) => {
    const productId = 789;
    clientSocket.emit('subscribe:product', String(productId));

    clientSocket.on('stock:update', (data) => {
      expect(data).toEqual({
        productId: productId,
        stock: 10,
        available: true,
      });
      done();
    });

    setTimeout(() => {
      emitStockUpdate(productId, 10);
    }, 50);
  });
});
