import { randomBytes, createHash } from 'node:crypto';
import mongoose, { type Document, type Model } from 'mongoose';

export interface UserDocument extends Document {
  name: string;
  email: string;
  phone?: string;
  passwordHash: string;
  emailVerified: boolean;
  accountStatus: 'active' | 'locked' | 'disabled';
  failedLoginAttempts: number;
  lockUntil?: Date;
  lastLoginAt?: Date;
  passwordChangedAt?: Date;
  roleIds: mongoose.Types.ObjectId[];
  tenantId?: string;
  branchIds?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SessionDocument extends Document {
  userId: mongoose.Types.ObjectId;
  refreshTokenHash: string;
  expiresAt: Date;
  revokedAt?: Date;
  lastUsedAt: Date;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OneTimeTokenDocument extends Document {
  userId: mongoose.Types.ObjectId;
  tokenHash: string;
  type: 'verification' | 'reset';
  expiresAt: Date;
  usedAt?: Date;
  createdAt: Date;
}

const userSchema = new mongoose.Schema<UserDocument>(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    passwordHash: { type: String, required: true, select: false },
    emailVerified: { type: Boolean, default: false },
    accountStatus: { type: String, enum: ['active', 'locked', 'disabled'], default: 'active' },
    failedLoginAttempts: { type: Number, default: 0 },
    lockUntil: Date,
    lastLoginAt: Date,
    passwordChangedAt: Date,
    roleIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Role' }],
    tenantId: { type: String, index: true },
    branchIds: [{ type: String }],
  },
  { timestamps: true },
);
userSchema.index({ email: 1 }, { unique: true });


const sessionSchema = new mongoose.Schema<SessionDocument>(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    refreshTokenHash: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: true },
    revokedAt: Date,
    lastUsedAt: { type: Date, required: true },
    ipAddress: String,
    userAgent: String,
  },
  { timestamps: true },
);

const oneTimeTokenSchema = new mongoose.Schema<OneTimeTokenDocument>({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  tokenHash: { type: String, required: true, unique: true },
  type: { type: String, enum: ['verification', 'reset'], required: true },
  expiresAt: { type: Date, required: true, index: true },
  usedAt: Date,
  createdAt: { type: Date, default: Date.now },
});
oneTimeTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const User =
  (mongoose.models.User as Model<UserDocument>) || mongoose.model('User', userSchema);
export const Session =
  (mongoose.models.Session as Model<SessionDocument>) || mongoose.model('Session', sessionSchema);
export const OneTimeToken =
  (mongoose.models.OneTimeToken as Model<OneTimeTokenDocument>) ||
  mongoose.model('OneTimeToken', oneTimeTokenSchema);

export function createOpaqueToken() {
  const token = randomBytes(32).toString('hex');
  return { token, tokenHash: createHash('sha256').update(token).digest('hex') };
}

export function hashOpaqueToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}
