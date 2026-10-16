import mongoose, { Document, Schema } from 'mongoose';

export enum ItemDonationStatus {
  PENDING = 'PENDING',
  RESERVED = 'RESERVED',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

export interface IItemDonation extends Document {
  userId: mongoose.Types.ObjectId;
  wishlistItemId: mongoose.Types.ObjectId;
  quantity: number;
  status: ItemDonationStatus;
  deliveryMode?: string;
  pledgedAt: Date;
  confirmedAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ItemDonationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    wishlistItemId: { type: Schema.Types.ObjectId, ref: 'WishlistItem', required: true },
    quantity: { type: Number, required: true, min: 1 },
    status: { type: String, enum: Object.values(ItemDonationStatus), default: ItemDonationStatus.RESERVED },
    deliveryMode: { type: String, default: 'SELF_DELIVERY' },
    pledgedAt: { type: Date, default: Date.now },
    confirmedAt: { type: Date },
    notes: { type: String },
  },
  { timestamps: true }
);

ItemDonationSchema.index({ userId: 1 });
ItemDonationSchema.index({ wishlistItemId: 1 });
ItemDonationSchema.index({ status: 1 });

export const ItemDonation = mongoose.model<IItemDonation>('ItemDonation', ItemDonationSchema);
