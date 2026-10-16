import mongoose, { Document, Schema } from 'mongoose';

export enum WishlistItemStatus {
  OPEN = 'OPEN',
  PARTIALLY_FULFILLED = 'PARTIALLY_FULFILLED',
  FULFILLED = 'FULFILLED',
  CLOSED = 'CLOSED',
}

export enum ItemPriority {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

export interface IWishlistItem extends Document {
  wishlistId: mongoose.Types.ObjectId;
  itemName: string;
  category: string;
  description: string;
  requiredQuantity: number;
  fulfilledQuantity: number;
  pledgedQuantity: number;
  status: WishlistItemStatus;
  priority: ItemPriority;
  imageUrl?: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

const WishlistItemSchema = new Schema(
  {
    wishlistId: { type: Schema.Types.ObjectId, ref: 'Wishlist', required: true },
    itemName: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    requiredQuantity: { type: Number, required: true, min: 1 },
    fulfilledQuantity: { type: Number, default: 0, min: 0 },
    pledgedQuantity: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: Object.values(WishlistItemStatus), default: WishlistItemStatus.OPEN },
    priority: { type: String, enum: Object.values(ItemPriority), default: ItemPriority.MEDIUM },
    imageUrl: { type: String },
    version: { type: Number, default: 0 },
  },
  { timestamps: true }
);

WishlistItemSchema.index({ wishlistId: 1 });
WishlistItemSchema.index({ status: 1 });

export const WishlistItem = mongoose.model<IWishlistItem>('WishlistItem', WishlistItemSchema);
