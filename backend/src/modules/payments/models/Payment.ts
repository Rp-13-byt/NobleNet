import mongoose, { Document, Schema } from 'mongoose';

export enum PaymentStatus {
  CREATED = 'CREATED',
  ORDER_CREATED = 'ORDER_CREATED',
  PENDING = 'PENDING',
  AUTHORIZED = 'AUTHORIZED',
  CAPTURED = 'CAPTURED',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED',
  REFUND_PENDING = 'REFUND_PENDING',
  REFUNDED = 'REFUNDED',
  REFUND_FAILED = 'REFUND_FAILED',
  EXPIRED = 'EXPIRED',
  FAILED = 'FAILED',
}

const LEGAL_PAYMENT_TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
  [PaymentStatus.CREATED]: [PaymentStatus.ORDER_CREATED, PaymentStatus.FAILED, PaymentStatus.EXPIRED],
  [PaymentStatus.ORDER_CREATED]: [PaymentStatus.PENDING, PaymentStatus.AUTHORIZED, PaymentStatus.CAPTURED, PaymentStatus.FAILED, PaymentStatus.EXPIRED],
  [PaymentStatus.PENDING]: [PaymentStatus.AUTHORIZED, PaymentStatus.CAPTURED, PaymentStatus.FAILED, PaymentStatus.EXPIRED],
  [PaymentStatus.AUTHORIZED]: [PaymentStatus.CAPTURED, PaymentStatus.FAILED],
  [PaymentStatus.CAPTURED]: [PaymentStatus.REFUND_PENDING, PaymentStatus.PARTIALLY_REFUNDED, PaymentStatus.REFUNDED],
  [PaymentStatus.PARTIALLY_REFUNDED]: [PaymentStatus.REFUND_PENDING, PaymentStatus.PARTIALLY_REFUNDED, PaymentStatus.REFUNDED],
  [PaymentStatus.REFUND_PENDING]: [PaymentStatus.REFUNDED, PaymentStatus.PARTIALLY_REFUNDED, PaymentStatus.REFUND_FAILED, PaymentStatus.CAPTURED],
  [PaymentStatus.REFUND_FAILED]: [PaymentStatus.REFUND_PENDING, PaymentStatus.CAPTURED],
  [PaymentStatus.REFUNDED]: [], // terminal
  [PaymentStatus.EXPIRED]: [],  // terminal
  [PaymentStatus.FAILED]: [],   // terminal
};

export function canTransitionPayment(current: PaymentStatus, target: PaymentStatus): boolean {
  if (current === target) return true;
  const allowed = LEGAL_PAYMENT_TRANSITIONS[current] || [];
  return allowed.includes(target);
}

export interface IPayment extends Document {
  donationId: mongoose.Types.ObjectId;
  gateway: string;
  orderId: string;
  paymentId?: string;
  signature?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  idempotencyKey?: string;
  paidAt?: Date;
  expiresAt?: Date;
  failureReason?: string;
  refundId?: string;
  refundAmount?: number;
  refundedAmount?: number;
  refundReason?: string;
  refundedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema(
  {
    donationId: { type: Schema.Types.ObjectId, ref: 'Donation', required: true },
    gateway: { type: String, required: true },
    orderId: { type: String, required: true, unique: true },
    paymentId: { type: String },
    signature: { type: String },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    status: { type: String, enum: Object.values(PaymentStatus), default: PaymentStatus.CREATED },
    idempotencyKey: { type: String },
    paidAt: { type: Date },
    expiresAt: { type: Date },
    failureReason: { type: String },
    refundId: { type: String },
    refundAmount: { type: Number },
    refundedAmount: { type: Number, default: 0 },
    refundReason: { type: String },
    refundedAt: { type: Date },
  },
  { timestamps: true }
);

PaymentSchema.index({ donationId: 1 });
PaymentSchema.index({ idempotencyKey: 1 });
PaymentSchema.index({ status: 1 });
PaymentSchema.index({ expiresAt: 1 });

export const Payment = mongoose.model<IPayment>('Payment', PaymentSchema);
