import mongoose, { type Document, type Model } from 'mongoose';
import type { WeeklyBusinessHours, RestaurantStatus, TaxConfig, AvatarMeta } from '@x10think/types';

export interface RestaurantDocument extends Document {
  tenantId: string;
  name: string;
  legalName: string;
  description?: string;
  logo?: AvatarMeta;
  email: string;
  phone: string;
  website?: string;
  address: {
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
  };
  cuisineTypes: string[];
  taxConfig?: TaxConfig;
  currency: string;
  timezone: string;
  status: RestaurantStatus;
  statusReason?: string;
  businessHours?: WeeklyBusinessHours;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const businessHoursIntervalSchema = new mongoose.Schema(
  {
    open: { type: String, required: true },
    close: { type: String, required: true },
    isClosed: { type: Boolean, default: false },
  },
  { _id: false },
);

const dayBusinessHoursSchema = new mongoose.Schema(
  {
    day: {
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      required: true,
    },
    isClosed: { type: Boolean, default: false },
    intervals: [businessHoursIntervalSchema],
  },
  { _id: false },
);

const restaurantSchema = new mongoose.Schema<RestaurantDocument>(
  {
    tenantId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    legalName: { type: String, required: true, trim: true, maxlength: 150 },
    description: { type: String, trim: true, maxlength: 500 },
    logo: {
      url: String,
      publicId: String,
      width: Number,
      height: Number,
      format: String,
    },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    website: { type: String, trim: true },
    address: {
      label: { type: String, default: 'Headquarters' },
      recipientName: { type: String, required: true },
      phone: { type: String, required: true },
      addressLine1: { type: String, required: true },
      addressLine2: String,
      landmark: String,
      city: { type: String, required: true },
      state: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, default: 'India' },
    },
    cuisineTypes: [{ type: String }],
    taxConfig: {
      gstNumber: String,
      panNumber: String,
      taxRate: Number,
    },
    currency: { type: String, default: 'INR', uppercase: true },
    timezone: { type: String, default: 'Asia/Kolkata' },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'ONBOARDING'],
      default: 'ACTIVE',
    },
    statusReason: String,
    businessHours: [dayBusinessHoursSchema],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

restaurantSchema.index({ tenantId: 1, status: 1 });
restaurantSchema.index({ legalName: 1 });

export const Restaurant =
  (mongoose.models.Restaurant as Model<RestaurantDocument>) ||
  mongoose.model('Restaurant', restaurantSchema);
