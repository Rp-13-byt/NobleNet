import { OutboxEvent, OutboxStatus } from '../events/models/OutboxEvent';
import { logger } from '../core/utils/logger';
import { eventEmitter } from '../events/EventEmitter';

export class OutboxWorker {
  static async processPendingEvents() {
    try {
      const pendingEvents = await OutboxEvent.find({ status: OutboxStatus.PENDING })
        .sort({ createdAt: 1 })
        .limit(20);

      for (const event of pendingEvents) {
        try {
          // Emit event to background subscribers
          eventEmitter.emit(event.eventType, event.payload);

          event.status = OutboxStatus.PROCESSED;
          event.processedAt = new Date();
          await event.save();
          logger.info(`[OUTBOX] Processed event ${event.eventType} (${event._id})`);
        } catch (err: any) {
          event.retries += 1;
          event.error = err.message;
          if (event.retries >= 5) {
            event.status = OutboxStatus.FAILED;
          }
          await event.save();
          logger.error({ err }, `[OUTBOX] Failed event ${event.eventType}`);
        }
      }
    } catch (err) {
      logger.error({ err }, '[OUTBOX] Error scanning outbox table');
    }
  }
}
