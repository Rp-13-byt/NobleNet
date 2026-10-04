import mongoose, { Document, Schema } from 'mongoose';

export enum ApplicationStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  WITHDRAWN = 'WITHDRAWN',
  COMPLETED = 'COMPLETED',
}

export interface IVolunteerApplication extends Document {
  opportunityId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  availability: string;
  skills: string[];
  experience: string;
  message: string;
  status: ApplicationStatus;
  appliedAt: Date;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const VolunteerApplicationSchema = new Schema(
  {
    opportunityId: { type: Schema.Types.ObjectId, ref: 'VolunteerOpportunity', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    availability: { type: String },
    skills: [{ type: String }],
    experience: { type: String },
    message: { type: String },
    status: { type: String, enum: Object.values(ApplicationStatus), default: ApplicationStatus.PENDING },
    appliedAt: { type: Date, default: Date.now },
    reviewedAt: { type: Date },
  },
  { timestamps: true }
);

// Compound unique index: one user cannot apply twice to the same opportunity
VolunteerApplicationSchema.index({ userId: 1, opportunityId: 1 }, { unique: true });
VolunteerApplicationSchema.index({ opportunityId: 1 });

export const VolunteerApplication = mongoose.model<IVolunteerApplication>('VolunteerApplication', VolunteerApplicationSchema);
