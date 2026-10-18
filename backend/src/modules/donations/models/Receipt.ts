import mongoose, { Document, Schema } from 'mongoose';

export enum ReceiptStatus {
  QUEUED = 'QUEUED',
  GENERATING = 'GENERATING',
  READY = 'READY',
  FAILED = 'FAILED',
}

export interface IReceipt extends Document {
  donationId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  receiptNumber: string;
  receiptUrl?: string;
  generatedAt?: Date;
  status: ReceiptStatus;
  createdAt: Date;
}

const ReceiptSchema = new Schema(
  {
    donationId: { type: Schema.Types.ObjectId, ref: 'Donation', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    receiptNumber: { type: String, required: true, unique: true },
    receiptUrl: { type: String },
    generatedAt: { type: Date },
    status: { type: String, enum: Object.values(ReceiptStatus), default: ReceiptStatus.QUEUED },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

ReceiptSchema.index({ donationId: 1 });
ReceiptSchema.index({ userId: 1 });

export const Receipt = mongoose.model<IReceipt>('Receipt', ReceiptSchema);
