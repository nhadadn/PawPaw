import cron from 'node-cron';
import logger from '../lib/logger';
import { AbandonedCartRecoveryService } from '../services/abandonedCartRecovery.service';

const recoveryService = new AbandonedCartRecoveryService();

export function startAbandonedCartRecoveryJob() {
  // Run every 10 minutes
  // Cron syntax: "*/10 * * * *"
  cron.schedule('*/10 * * * *', async () => {
    logger.info('[Job] Starting Abandoned Cart Recovery scan...');
    try {
      await recoveryService.scanExpiredReservations();
      logger.info('[Job] Abandoned Cart Recovery scan completed.');
    } catch (error) {
      logger.error('[Job] Abandoned Cart Recovery scan failed', { error });
    }
  });

  logger.info('Abandoned Cart Recovery Job scheduled (every 10 minutes)');
}
