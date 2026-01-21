import cron from 'node-cron';
import prisma from '../lib/prisma';
import logger from '../lib/logger';

export async function cleanupOldWebhooksOnce(): Promise<void> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  try {
    const { count } = await prisma.webhookEvent.deleteMany({
      where: {
        processedAt: {
          lt: thirtyDaysAgo,
        },
      },
    });

    if (count > 0) {
      logger.info(`Cleaned up ${count} old webhook events`);
    }
  } catch (error) {
    logger.error('Error cleaning up webhook events', { error });
  }
}

export function startWebhookCleanupScheduler(): void {
  // Run every day at 3 AM
  cron.schedule('0 3 * * *', () => {
    logger.info('Running webhook cleanup job');
    void cleanupOldWebhooksOnce();
  });
}
