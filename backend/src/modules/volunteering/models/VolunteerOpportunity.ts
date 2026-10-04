import mongoose, { Document, Schema } from 'mongoose';

export enum OpportunityStatus {
  DRAFT = 'DRAFT',
  OPEN = 'OPEN',
  FULL = 'FULL',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface IVolunteerOpportunity extends Document {
  ngoId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  category: string;
  location: string;
  isRemote: boolean;
  eventDate: Date;
  startTime: string;
  endTime: string;
  requiredSkills: string[];
  requiredVolunteers: number;
  approvedVolunteers: number;
  status: OpportunityStatus;
  createdAt: Date;
  updatedAt: Date;
}

const VolunteerOpportunitySchema = new Schema(
  {
    ngoId: { type: Schema.Types.ObjectId, ref: 'NGO', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    location: { type: String, required: true },
    isRemote: { type: Boolean, default: false },
    eventDate: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    requiredSkills: [{ type: String }],
    requiredVolunteers: { type: Number, required: true, min: 1 },
    approvedVolunteers: { type: Number, default: 0 },
    status: { type: String, enum: Object.values(OpportunityStatus), default: OpportunityStatus.DRAFT },
  },
  { timestamps: true }
);

VolunteerOpportunitySchema.index({ ngoId: 1 });
VolunteerOpportunitySchema.index({ status: 1 });
VolunteerOpportunitySchema.index({ category: 1 });
VolunteerOpportunitySchema.index({ eventDate: 1 });

export const VolunteerOpportunity = mongoose.model<IVolunteerOpportunity>('VolunteerOpportunity', VolunteerOpportunitySchema);
