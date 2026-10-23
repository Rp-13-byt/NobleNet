import mongoose, { Document, Schema } from 'mongoose';

export enum NotificationType {
  DONATION_SUCCESS = 'DONATION_SUCCESS',
  DONATION_FAILED = 'DONATION_FAILED',
  RECEIPT_READY = 'RECEIPT_READY',
  CAMPAIGN_UPDATE = 'CAMPAIGN_UPDATE',
  VOLUNTEER_APPROVED = 'VOLUNTEER_APPROVED',
  VOLUNTEER_REJECTED = 'VOLUNTEER_REJECTED',
  VOLUNTEER_APPLICATION_RECEIVED = 'VOLUNTEER_APPLICATION_RECEIVED',
  ITEM_PLEDGED = 'ITEM_PLEDGED',
  NGO_VERIFIED = 'NGO_VERIFIED',
  SYSTEM_ALERT = 'SYSTEM_ALERT',
}

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
  read: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: Object.values(NotificationType), required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    data: { type: Schema.Types.Mixed },
    read: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

NotificationSchema.index({ userId: 1, read: 1 });
NotificationSchema.index({ createdAt: -1 });

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
