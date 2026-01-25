import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import { createApp } from './app';
import logger from './lib/logger';
import { createInventoryServer } from './websocket/inventory.socket';
import { startExpirationScheduler } from './scheduler/expiration.scheduler';
import { startWebhookCleanupScheduler } from './scheduler/webhookCleanup';
import { startAbandonedCartRecoveryJob } from './scheduler/abandonedCartRecovery.job';

const port = process.env.PORT || 4000;

const startServer = async () => {
  const app = createApp();

  // Create HTTP server to support WebSockets
  const server = http.createServer(app);

  // Initialize WebSocket Server
  createInventoryServer(server);

  startExpirationScheduler();
  startWebhookCleanupScheduler();

  // Only start recovery job if enabled (or default to true in prod)
  if (process.env.ENABLE_RECOVERY_JOB !== 'false') {
    startAbandonedCartRecoveryJob();
  }

  server.listen(port, () => {
    logger.info(`Server running on port ${port}`);
  });
};

startServer().catch((err) => {
  logger.error('Failed to start server', { error: err });
  process.exit(1);
});
