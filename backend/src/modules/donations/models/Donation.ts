import mongoose, { Document, Schema } from 'mongoose';

export enum DonationStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  CONFIRMED = 'CONFIRMED',
  SUCCESS = 'CONFIRMED', // alias mapping
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

const LEGAL_DONATION_TRANSITIONS: Record<string, string[]> = {
  [DonationStatus.PENDING]: [DonationStatus.PROCESSING, DonationStatus.CONFIRMED, DonationStatus.FAILED, DonationStatus.CANCELLED],
  [DonationStatus.PROCESSING]: [DonationStatus.CONFIRMED, DonationStatus.FAILED, DonationStatus.CANCELLED],
  [DonationStatus.CONFIRMED]: [DonationStatus.REFUNDED],
  [DonationStatus.FAILED]: [],
  [DonationStatus.CANCELLED]: [],
  [DonationStatus.REFUNDED]: [],
};

export function canTransitionDonation(current: string, target: string): boolean {
  if (current === target) return true;
  const currentNormalized = current === 'SUCCESS' ? DonationStatus.CONFIRMED : current;
  const targetNormalized = target === 'SUCCESS' ? DonationStatus.CONFIRMED : target;
  if (currentNormalized === targetNormalized) return true;
  const allowed = LEGAL_DONATION_TRANSITIONS[currentNormalized] || [];
  return allowed.includes(targetNormalized);
}

export interface IDonation extends Document {
  userId: mongoose.Types.ObjectId;
  campaignId: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  donationType: string;
  paymentStatus: DonationStatus;
  transactionReference: string;
  anonymous: boolean;
  donatedAt?: Date;
  idempotencyKey?: string;
  failureReason?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const DonationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true },
    amount: { type: Number, required: true, min: 1 },
    currency: { type: String, default: 'INR' },
    donationType: { type: String, default: 'MONETARY' },
    paymentStatus: {
      type: String,
      enum: ['PENDING', 'PROCESSING', 'CONFIRMED', 'SUCCESS', 'FAILED', 'CANCELLED', 'REFUNDED'],
      default: DonationStatus.PENDING,
    },
    transactionReference: { type: String, unique: true, sparse: true },
    anonymous: { type: Boolean, default: false },
    idempotencyKey: { type: String },
    failureReason: { type: String },
    donatedAt: { type: Date },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

DonationSchema.index({ userId: 1 });
DonationSchema.index({ campaignId: 1 });
DonationSchema.index({ paymentStatus: 1 });
DonationSchema.index({ idempotencyKey: 1 });

export const Donation = mongoose.model<IDonation>('Donation', DonationSchema);

/**
 * Startup migration unifying any legacy 'SUCCESS' rows to canonical 'CONFIRMED'
 */
export async function migrateLegacyDonationStatuses(): Promise<number> {
  try {
    const res = await Donation.collection.updateMany(
      { paymentStatus: 'SUCCESS' as any },
      { $set: { paymentStatus: DonationStatus.CONFIRMED } }
    );
    if (res.modifiedCount > 0) {
      console.log(`[MIGRATION] Migrated ${res.modifiedCount} legacy SUCCESS donations to CONFIRMED`);
    }
    return res.modifiedCount;
  } catch (err: any) {
    console.warn('[MIGRATION] Donation status migration skipped:', err.message);
    return 0;
  }
}
