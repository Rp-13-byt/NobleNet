import mongoose, { Document, Schema } from 'mongoose';

export enum WebhookEventStatus {
  PENDING = 'PENDING',
  PROCESSED = 'PROCESSED',
  FAILED = 'FAILED',
}

export interface IWebhookEvent extends Document {
  provider: string;
  eventId: string;
  eventType: string;
  payloadHash?: string;
  payload?: any;
  status: WebhookEventStatus;
  processingError?: string;
  receivedAt: Date;
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const WebhookEventSchema = new Schema(
  {
    provider: { type: String, required: true },
    eventId: { type: String, required: true },
    eventType: { type: String, required: true },
    payloadHash: { type: String },
    payload: { type: Schema.Types.Mixed },
    status: { type: String, enum: Object.values(WebhookEventStatus), default: WebhookEventStatus.PENDING },
    processingError: { type: String },
    receivedAt: { type: Date, default: Date.now },
    processedAt: { type: Date },
  },
  { timestamps: true }
);

// Idempotency constraint: identical provider + eventId can only be recorded once
WebhookEventSchema.index({ provider: 1, eventId: 1 }, { unique: true });
WebhookEventSchema.index({ status: 1, receivedAt: 1 });

export const WebhookEvent = mongoose.model<IWebhookEvent>('WebhookEvent', WebhookEventSchema);
