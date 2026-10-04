import mongoose, { Document, Schema } from 'mongoose';

export enum OutboxStatus {
  PENDING = 'PENDING',
  PROCESSED = 'PROCESSED',
  FAILED = 'FAILED',
}

export interface IOutboxEvent extends Document {
  eventType: string;
  payload: Record<string, any>;
  status: OutboxStatus;
  retries: number;
  error?: string;
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const OutboxEventSchema = new Schema(
  {
    eventType: { type: String, required: true },
    payload: { type: Schema.Types.Mixed, required: true },
    status: { type: String, enum: Object.values(OutboxStatus), default: OutboxStatus.PENDING },
    retries: { type: Number, default: 0 },
    error: { type: String },
    processedAt: { type: Date },
  },
  { timestamps: true }
);

OutboxEventSchema.index({ status: 1, createdAt: 1 });

export const OutboxEvent = mongoose.model<IOutboxEvent>('OutboxEvent', OutboxEventSchema);
