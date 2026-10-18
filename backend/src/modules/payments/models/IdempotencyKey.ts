import mongoose, { Document, Schema } from 'mongoose';

export interface IIdempotencyKey extends Document {
  key: string;
  userId?: mongoose.Types.ObjectId;
  endpoint: string;
  responseStatus: number;
  responseData: any;
  createdAt: Date;
}

const IdempotencyKeySchema = new Schema(
  {
    key: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    endpoint: { type: String, required: true },
    responseStatus: { type: Number, required: true },
    responseData: { type: Schema.Types.Mixed, required: true },
    createdAt: { type: Date, default: Date.now, expires: 86400 }, // 24 hours TTL index
  },
  { timestamps: false }
);

// Scoped compound index
IdempotencyKeySchema.index({ userId: 1, key: 1, endpoint: 1 }, { unique: true });

export const IdempotencyKey = mongoose.model<IIdempotencyKey>('IdempotencyKey', IdempotencyKeySchema);
