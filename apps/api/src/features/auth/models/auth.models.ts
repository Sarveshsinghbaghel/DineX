import { randomBytes, createHash } from 'node:crypto';
import mongoose, { type Document, type Model } from 'mongoose';

export interface UserDocument extends Document {
  name: string;
  email: string;
  phone?: string;
  passwordHash: string;
  emailVerified: boolean;
  accountStatus: 'active' | 'inactive' | 'suspended' | 'pending_verification' | 'locked';
  statusReason?: string;
  profile?: {
    firstName: string;
    lastName: string;
    displayName?: string;
  };
  avatar?: {
    url: string;
    publicId: string;
    width?: number;
    height?: number;
    format?: string;
  };
  addresses?: Array<{
    _id: mongoose.Types.ObjectId;
    label: string;
    recipientName: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    landmark?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    latitude?: number;
    longitude?: number;
    isDefault: boolean;
    createdAt?: Date;
    updatedAt?: Date;
  }>;
  preferences?: {
    theme: 'light' | 'dark' | 'system';
    language: string;
    marketingPreferences: { email: boolean; sms: boolean; push: boolean };
    orderNotifications: { email: boolean; sms: boolean; push: boolean };
    reservationNotifications: { email: boolean; sms: boolean; push: boolean };
    dietaryPreferences: string[];
  };
  failedLoginAttempts: number;
  lockUntil?: Date;
  lastLoginAt?: Date;
  passwordChangedAt?: Date;
  roleIds: mongoose.Types.ObjectId[];
  tenantId?: string;
  branchIds?: string[];
  locale?: string;
  timezone?: string;
  customerProfile?: {
    loyalty?: {
      points: number;
      tier?: string;
    };
  };
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

const addressSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true },
    recipientName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    addressLine1: { type: String, required: true, trim: true },
    addressLine2: { type: String, trim: true },
    landmark: { type: String, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    postalCode: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true, default: 'India' },
    latitude: Number,
    longitude: Number,
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true },
);

const userSchema = new mongoose.Schema<UserDocument>(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    passwordHash: { type: String, required: true, select: false },
    emailVerified: { type: Boolean, default: false },
    accountStatus: {
      type: String,
      enum: ['active', 'inactive', 'suspended', 'pending_verification', 'locked'],
      default: 'active',
    },
    statusReason: { type: String, trim: true },
    profile: {
      firstName: { type: String, trim: true },
      lastName: { type: String, trim: true },
      displayName: { type: String, trim: true },
    },
    avatar: {
      url: String,
      publicId: String,
      width: Number,
      height: Number,
      format: String,
    },
    addresses: [addressSchema],
    preferences: {
      theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
      language: { type: String, default: 'en' },
      marketingPreferences: {
        email: { type: Boolean, default: true },
        sms: { type: Boolean, default: false },
        push: { type: Boolean, default: true },
      },
      orderNotifications: {
        email: { type: Boolean, default: true },
        sms: { type: Boolean, default: true },
        push: { type: Boolean, default: true },
      },
      reservationNotifications: {
        email: { type: Boolean, default: true },
        sms: { type: Boolean, default: true },
        push: { type: Boolean, default: true },
      },
      dietaryPreferences: [{ type: String }],
    },
    failedLoginAttempts: { type: Number, default: 0 },
    lockUntil: Date,
    lastLoginAt: Date,
    passwordChangedAt: Date,
    roleIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Role' }],
    tenantId: { type: String, index: true },
    branchIds: [{ type: String }],
    customerProfile: {
      loyalty: {
        points: { type: Number, default: 0, min: 0 },
        tier: String,
      },
    },
    locale: { type: String, default: 'en-IN' },
    timezone: { type: String, default: 'Asia/Kolkata' },
  },
  { timestamps: true },
);
userSchema.index({ tenantId: 1, accountStatus: 1 });

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
