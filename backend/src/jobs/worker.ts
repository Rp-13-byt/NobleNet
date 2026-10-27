import { Worker } from 'bullmq';
import { env } from '../config/env';
import { logger } from '../core/utils/logger';
import { NotificationService } from '../modules/notifications/services/notification.service';
import { connectDB } from '../database/mongo';

const connection = { url: env.REDIS_URL };

const startWorkers = async () => {
  await connectDB();
  logger.info('👷 Starting background workers...');

  const notificationWorker = new Worker('notificationQueue', async job => {
    logger.info(`Processing notification job: ${job.id}`);
    if (job.name === 'create-notification') {
      await NotificationService.create(job.data);
    }
  }, { connection });

  notificationWorker.on('completed', job => {
    logger.info(`✅ Job ${job.id} has completed!`);
  });

  notificationWorker.on('failed', (job, err) => {
    logger.error(`❌ Job ${job?.id} has failed with ${err.message}`);
  });

  // Similarly setup receiptWorker, emailWorker, analyticsWorker
};

startWorkers();
