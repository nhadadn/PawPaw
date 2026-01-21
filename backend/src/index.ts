import dotenv from 'dotenv';
dotenv.config();

import { createApp } from './app';
import logger from './lib/logger';
import { startExpirationScheduler } from './scheduler/expiration.scheduler';
import { startWebhookCleanupScheduler } from './scheduler/webhookCleanup';

const port = process.env.PORT || 4000;

const startServer = async () => {
  const app = createApp();
  startExpirationScheduler();
  startWebhookCleanupScheduler();

  app.listen(port, () => {
    logger.info(`Server running on port ${port}`);
  });
};

startServer().catch((err) => {
  logger.error('Failed to start server', { error: err });
  process.exit(1);
});
