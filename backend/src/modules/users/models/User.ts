import mongoose, { Document, Schema } from 'mongoose';

export enum UserRole {
  USER = 'USER',
  NGO = 'NGO',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
}

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  profileImage?: string;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    profileImage: { type: String },
    role: { type: String, enum: Object.values(UserRole), default: UserRole.USER },
    status: { type: String, enum: Object.values(UserStatus), default: UserStatus.ACTIVE },
    emailVerified: { type: Boolean, default: false },
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

UserSchema.index({ role: 1 });
UserSchema.index({ status: 1 });

export const User = mongoose.model<IUser>('User', UserSchema);
