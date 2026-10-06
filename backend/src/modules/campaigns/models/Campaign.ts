import mongoose, { Document, Schema } from 'mongoose';

export enum CampaignStatus {
  DRAFT = 'DRAFT',
  PENDING_REVIEW = 'PENDING_REVIEW',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface ICampaign extends Document {
  ngoId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  goalAmount: number;
  raisedAmount: number;
  startDate: Date;
  endDate: Date;
  images: string[];
  status: CampaignStatus;
  category: string;
  createdAt: Date;
  updatedAt: Date;
}

const CampaignSchema: Schema = new Schema(
  {
    ngoId: { type: Schema.Types.ObjectId, ref: 'NGO', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    goalAmount: { type: Number, required: true, min: 1 },
    raisedAmount: { type: Number, default: 0, min: 0 },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    images: [{ type: String }],
    status: { type: String, enum: Object.values(CampaignStatus), default: CampaignStatus.DRAFT },
    category: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

CampaignSchema.index({ ngoId: 1 });
CampaignSchema.index({ status: 1 });
CampaignSchema.index({ category: 1 });
CampaignSchema.index({ title: 'text', description: 'text' });

export const Campaign = mongoose.model<ICampaign>('Campaign', CampaignSchema);
