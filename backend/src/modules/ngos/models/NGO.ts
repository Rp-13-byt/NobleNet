import mongoose, { Document, Schema } from 'mongoose';

export enum NgoStatus {
  PENDING = 'PENDING',
  UNDER_REVIEW = 'UNDER_REVIEW',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
  SUSPENDED = 'SUSPENDED',
}

export interface INGO extends Document {
  userId: mongoose.Types.ObjectId;
  organizationName: string;
  registrationNumber: string;
  description: string;
  address: string;
  contactEmail: string;
  contactPhone: string;
  website?: string;
  documents: string[];
  status: NgoStatus;
  verificationNotes?: string;
  rejectionReason?: string;
  suspensionReason?: string;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  submittedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const NGOSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    organizationName: { type: String, required: true, trim: true },
    registrationNumber: { type: String, required: true, trim: true, unique: true },
    description: { type: String, required: true },
    address: { type: String, required: true },
    contactEmail: { type: String, required: true, trim: true, lowercase: true },
    contactPhone: { type: String, required: true, trim: true },
    website: { type: String, trim: true },
    documents: [{ type: String }],
    status: { type: String, enum: Object.values(NgoStatus), default: NgoStatus.PENDING },
    verificationNotes: { type: String },
    rejectionReason: { type: String },
    suspensionReason: { type: String },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

NGOSchema.index({ status: 1 });
NGOSchema.index({ organizationName: 'text' });

export const NGO = mongoose.model<INGO>('NGO', NGOSchema);
