import { EventEmitter } from 'events';
import { Queue } from 'bullmq';
import { env } from '../config/env';
import { logger } from '../core/utils/logger';

const eventEmitter = new EventEmitter();

// Setup BullMQ queues (mocked during tests to prevent unneeded network hangs)
const isTest = process.env.NODE_ENV === 'test';

class MockQueue {
  name: string;
  constructor(name: string) { this.name = name; }
  async add() { return Promise.resolve(); }
  on() { return this; }
  async close() { return Promise.resolve(); }
}

const connection = { url: env.REDIS_URL };

export const receiptQueue: Queue = isTest ? (new MockQueue('receiptQueue') as any) : new Queue('receiptQueue', { connection });
export const emailQueue: Queue = isTest ? (new MockQueue('emailQueue') as any) : new Queue('emailQueue', { connection });
export const notificationQueue: Queue = isTest ? (new MockQueue('notificationQueue') as any) : new Queue('notificationQueue', { connection });
export const analyticsQueue: Queue = isTest ? (new MockQueue('analyticsQueue') as any) : new Queue('analyticsQueue', { connection });

let redisWarned = false;
if (!isTest) {
  [receiptQueue, emailQueue, notificationQueue, analyticsQueue].forEach(q => {
    q.on('error', err => {
      if (!redisWarned) {
        logger.warn(
          `[QUEUE] Redis is not reachable at ${env.REDIS_URL}. Queues will retry quietly in the background. (Start Redis to enable asynchronous job processing).`
        );
        redisWarned = true;
      }
    });
  });
}

import mongoose from 'mongoose';
import { SocketService } from '../core/socket/socket.service';
import { Notification, NotificationType } from '../modules/notifications/models/Notification';
import { NGO } from '../modules/ngos/models/NGO';
import { Campaign } from '../modules/campaigns/models/Campaign';

// Define Application Events
export enum AppEvents {
  DONATION_SUCCESSFUL = 'DONATION_SUCCESSFUL',
  VOLUNTEER_APPROVED = 'VOLUNTEER_APPROVED',
  VOLUNTEER_REJECTED = 'VOLUNTEER_REJECTED',
  VOLUNTEER_APPLIED = 'VOLUNTEER_APPLIED',
  NGO_VERIFIED = 'NGO_VERIFIED',
  NGO_REJECTED = 'NGO_REJECTED',
  CAMPAIGN_CREATED = 'CAMPAIGN_CREATED',
  CAMPAIGN_UPDATED = 'CAMPAIGN_UPDATED',
  WISHLIST_ITEM_UPDATED = 'WISHLIST_ITEM_UPDATED',
  USER_STATUS_CHANGED = 'USER_STATUS_CHANGED',
}

// Bind Listeners
eventEmitter.on(AppEvents.DONATION_SUCCESSFUL, async (data: any) => {
  try {
    // 1. Direct DB Notification persistence for the donor
    if (data.userId) {
      const donorNotif = await Notification.create({
        userId: data.userId,
        type: NotificationType.DONATION_SUCCESS,
        title: 'Donation Confirmed',
        message: `Your donation of ₹${data.amount} was confirmed. Thank you for your support!`,
        data: { donationId: data.donationId, campaignId: data.campaignId, amount: data.amount },
      });
      SocketService.emitToUser(data.userId.toString(), 'notification.created', donorNotif);
    }

    // 2. Direct DB Notification persistence & socket alert for the NGO owning the campaign
    if (data.campaignId && mongoose.isValidObjectId(data.campaignId)) {
      const campaign = await Campaign.findById(data.campaignId);
      if (campaign && campaign.ngoId) {
        const ngo = await NGO.findById(campaign.ngoId);
        if (ngo && ngo.userId) {
          const ngoNotif = await Notification.create({
            userId: ngo.userId,
            type: NotificationType.DONATION_SUCCESS,
            title: 'Donation Received',
            message: `Your campaign "${campaign.title}" received a donation of ₹${data.amount}.`,
            data: { donationId: data.donationId, campaignId: data.campaignId, amount: data.amount },
          });
          SocketService.emitToUser(ngo.userId.toString(), 'notification.created', ngoNotif);
          SocketService.emitToUser(ngo.userId.toString(), 'ngo.donation.received', {
            campaignId: data.campaignId,
            amount: data.amount,
          });
        }
      }
    }

    // 3. Real-Time Socket.IO broadcast (Public summary update only - never leak donationId or donor info)
    SocketService.emitToAll('campaign.stats.updated', {
      campaignId: data.campaignId,
      amount: data.amount,
    });
    SocketService.emitToRole('SUPER_ADMIN', 'admin:stats.updated', { type: 'DONATION', amount: data.amount });

    // 4. Asynchronous background queue dispatches
    receiptQueue.add('generate-receipt', { donationId: data.donationId }).catch(() => {});
    if (data.userId) {
      emailQueue.add('send-donation-email', { userId: data.userId, amount: data.amount }).catch(() => {});
    }
    analyticsQueue.add('update-donation-stats', { amount: data.amount, campaignId: data.campaignId }).catch(() => {});
  } catch (error: any) {
    logger.error({ err: error?.message }, 'Error handling DONATION_SUCCESSFUL event');
  }
});

eventEmitter.on(AppEvents.VOLUNTEER_APPLIED, async (data: any) => {
  try {
    if (data.ngoId && mongoose.isValidObjectId(data.ngoId)) {
      const ngo = await NGO.findById(data.ngoId);
      if (ngo && ngo.userId) {
        const ngoNotif = await Notification.create({
          userId: ngo.userId,
          type: NotificationType.VOLUNTEER_APPLICATION_RECEIVED,
          title: 'New Volunteer Application',
          message: `A volunteer applied for "${data.opportunityTitle || 'Volunteer Drive'}".`,
          data: { applicationId: data.applicationId, opportunityId: data.opportunityId },
        });
        SocketService.emitToUser(ngo.userId.toString(), 'application.received', {
          applicationId: data.applicationId,
          opportunityId: data.opportunityId,
        });
        SocketService.emitToUser(ngo.userId.toString(), 'notification.created', ngoNotif);
      }
    }
  } catch (err: any) {
    logger.error({ err: err?.message }, 'Error handling VOLUNTEER_APPLIED event');
  }
});

eventEmitter.on(AppEvents.VOLUNTEER_APPROVED, async (data: any) => {
  try {
    const notif = await Notification.create({
      userId: data.userId,
      type: NotificationType.VOLUNTEER_APPROVED,
      title: 'Volunteer Application Approved',
      message: `Congratulations! Your application for "${data.opportunityTitle || 'Volunteer Drive'}" was approved.`,
      data: { applicationId: data.applicationId, opportunityId: data.opportunityId },
    });

    SocketService.emitToUser(data.userId.toString(), 'application.approved', {
      applicationId: data.applicationId,
      opportunityId: data.opportunityId,
    });
    SocketService.emitToUser(data.userId.toString(), 'notification.created', notif);
    emailQueue.add('send-volunteer-approval-email', { userId: data.userId }).catch(() => {});
  } catch (err: any) {
    logger.error({ err: err?.message }, 'Error handling VOLUNTEER_APPROVED event');
  }
});

eventEmitter.on(AppEvents.VOLUNTEER_REJECTED, async (data: any) => {
  try {
    const notif = await Notification.create({
      userId: data.userId,
      type: NotificationType.VOLUNTEER_REJECTED,
      title: 'Volunteer Application Update',
      message: `Your application for "${data.opportunityTitle || 'Volunteer Drive'}" was not selected.`,
      data: { applicationId: data.applicationId, opportunityId: data.opportunityId },
    });

    SocketService.emitToUser(data.userId.toString(), 'application.rejected', {
      applicationId: data.applicationId,
    });
    SocketService.emitToUser(data.userId.toString(), 'notification.created', notif);
  } catch (err: any) {
    logger.error({ err: err?.message }, 'Error handling VOLUNTEER_REJECTED event');
  }
});

eventEmitter.on(AppEvents.NGO_VERIFIED, async (data: any) => {
  try {
    const notif = await Notification.create({
      userId: data.userId,
      type: NotificationType.NGO_VERIFIED,
      title: 'NGO Verification Approved',
      message: `Your organization "${data.organizationName}" is now fully verified. You can now launch public campaigns and volunteer drives.`,
      data: { ngoId: data.ngoId },
    });

    SocketService.emitToUser(data.userId.toString(), 'ngo.verification.approved', {
      ngoId: data.ngoId,
    });
    SocketService.emitToUser(data.userId.toString(), 'notification.created', notif);
    SocketService.emitToAll('ngo.verified', { ngoId: data.ngoId });
  } catch (err: any) {
    logger.error({ err: err?.message }, 'Error handling NGO_VERIFIED event');
  }
});

eventEmitter.on(AppEvents.NGO_REJECTED, async (data: any) => {
  try {
    const notif = await Notification.create({
      userId: data.userId,
      type: NotificationType.SYSTEM_ALERT,
      title: 'NGO Verification Rejected',
      message: `Verification for "${data.organizationName}" was rejected: ${data.notes || 'Incomplete documentation'}. Please review and resubmit.`,
      data: { ngoId: data.ngoId, notes: data.notes },
    });

    SocketService.emitToUser(data.userId.toString(), 'ngo.verification.rejected', {
      ngoId: data.ngoId,
      notes: data.notes,
    });
    SocketService.emitToUser(data.userId.toString(), 'notification.created', notif);
  } catch (err: any) {
    logger.error({ err: err?.message }, 'Error handling NGO_REJECTED event');
  }
});

eventEmitter.on(AppEvents.WISHLIST_ITEM_UPDATED, async (data: any) => {
  SocketService.emitToAll('wishlist.item.updated', data);
});

eventEmitter.on(AppEvents.CAMPAIGN_CREATED, async (data: any) => {
  SocketService.emitToAll('campaign.created', data);
});

eventEmitter.on(AppEvents.CAMPAIGN_UPDATED, async (data: any) => {
  SocketService.emitToAll('campaign.updated', data);
});

eventEmitter.on(AppEvents.USER_STATUS_CHANGED, async (data: any) => {
  SocketService.emitToUser(data.userId.toString(), 'user.status.changed', { status: data.status });
  SocketService.emitToRole('SUPER_ADMIN', 'admin.user.updated', data);
});

export { eventEmitter };

