import mongoose, { Document, Schema } from 'mongoose';

export interface IImpactReport extends Document {
  ngoId: mongoose.Types.ObjectId;
  campaignId?: mongoose.Types.ObjectId;
  title: string;
  description: string;
  fundsUsed: number;
  beneficiariesReached: number;
  milestones: string[];
  images: string[];
  documents: string[];
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ImpactReportSchema = new Schema(
  {
    ngoId: { type: Schema.Types.ObjectId, ref: 'NGO', required: true },
    campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign' },
    title: { type: String, required: true },
    description: { type: String, required: true },
    fundsUsed: { type: Number, default: 0 },
    beneficiariesReached: { type: Number, default: 0 },
    milestones: [{ type: String }],
    images: [{ type: String }],
    documents: [{ type: String }],
    published: { type: Boolean, default: false },
  },
  { timestamps: true }
);

ImpactReportSchema.index({ ngoId: 1 });
ImpactReportSchema.index({ campaignId: 1 });

export const ImpactReport = mongoose.model<IImpactReport>('ImpactReport', ImpactReportSchema);
