import mongoose, { Schema, Document } from 'mongoose';

export interface IPledgedItem {
  wishlistItemId: mongoose.Types.ObjectId;
  quantityPledged: number;
}

export interface IItemDonation extends Document {
  donor: mongoose.Types.ObjectId;
  ngo: mongoose.Types.ObjectId;
  wishlist: mongoose.Types.ObjectId;
  items: IPledgedItem[];
  status: 'PLEDGED' | 'DELIVERED' | 'CANCELLED';
  createdAt: Date;
  updatedAt: Date;
}

const PledgedItemSchema = new Schema<IPledgedItem>({
  wishlistItemId: { type: Schema.Types.ObjectId, required: true },
  quantityPledged: { type: Number, required: true, min: 1 }
});

const ItemDonationSchema = new Schema<IItemDonation>({
  donor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  ngo: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  wishlist: { type: Schema.Types.ObjectId, ref: 'Wishlist', required: true },
  items: [PledgedItemSchema],
  status: { type: String, enum: ['PLEDGED', 'DELIVERED', 'CANCELLED'], default: 'PLEDGED' }
}, {
  timestamps: true
});

export const ItemDonation = mongoose.model<IItemDonation>('ItemDonation', ItemDonationSchema);
