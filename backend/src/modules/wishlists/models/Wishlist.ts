import mongoose, { Document, Schema } from 'mongoose';

export enum WishlistStatus {
  ACTIVE = 'ACTIVE',
  CLOSED = 'CLOSED',
}

export interface IWishlist extends Document {
  ngoId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  status: WishlistStatus;
  createdAt: Date;
  updatedAt: Date;
}

const WishlistSchema = new Schema(
  {
    ngoId: { type: Schema.Types.ObjectId, ref: 'NGO', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    status: { type: String, enum: Object.values(WishlistStatus), default: WishlistStatus.ACTIVE },
  },
  { timestamps: true }
);

WishlistSchema.index({ ngoId: 1 });
WishlistSchema.index({ status: 1 });

export const Wishlist = mongoose.model<IWishlist>('Wishlist', WishlistSchema);
