import mongoose, { Document, Schema } from 'mongoose';

export interface IReview extends Document {
  userId: mongoose.Types.ObjectId;
  ngoId: mongoose.Types.ObjectId;
  campaignId?: mongoose.Types.ObjectId;
  rating: number;
  comment: string;
  verifiedContribution: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    ngoId: { type: Schema.Types.ObjectId, ref: 'NGO', required: true },
    campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign' },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
    verifiedContribution: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// One review per user per NGO
ReviewSchema.index({ userId: 1, ngoId: 1 }, { unique: true });
ReviewSchema.index({ ngoId: 1 });

export const Review = mongoose.model<IReview>('Review', ReviewSchema);
