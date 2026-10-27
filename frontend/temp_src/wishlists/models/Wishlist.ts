import mongoose, { Schema, Document } from 'mongoose';

export interface IWishlistItem {
  _id?: mongoose.Types.ObjectId;
  name: string;
  quantityNeeded: number;
  quantityPledged: number;
  quantityReceived: number;
  notes?: string;
  status: 'ACTIVE' | 'FULFILLED';
}

export interface IWishlist extends Document {
  ngo: mongoose.Types.ObjectId;
  title: string;
  description: string;
  items: IWishlistItem[];
  status: 'ACTIVE' | 'FULFILLED';
  createdAt: Date;
  updatedAt: Date;
}

const WishlistItemSchema = new Schema<IWishlistItem>({
  name: { type: String, required: true },
  quantityNeeded: { type: Number, required: true, min: 1 },
  quantityPledged: { type: Number, default: 0 },
  quantityReceived: { type: Number, default: 0 },
  notes: { type: String },
  status: { type: String, enum: ['ACTIVE', 'FULFILLED'], default: 'ACTIVE' }
});

const WishlistSchema = new Schema<IWishlist>({
  ngo: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  items: [WishlistItemSchema],
  status: { type: String, enum: ['ACTIVE', 'FULFILLED'], default: 'ACTIVE' }
}, {
  timestamps: true
});

export const Wishlist = mongoose.model<IWishlist>('Wishlist', WishlistSchema);
