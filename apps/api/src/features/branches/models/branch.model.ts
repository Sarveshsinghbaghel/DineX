import mongoose, { type Document, type Model } from 'mongoose';
import type { WeeklyBusinessHours, BranchStatus, BranchCoordinates } from '@x10think/types';

export interface BranchDocument extends Document {
  restaurantId: mongoose.Types.ObjectId;
  tenantId: string;
  name: string;
  code: string;
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
  phone: string;
  email?: string;
  managerId?: mongoose.Types.ObjectId;
  businessHours?: WeeklyBusinessHours;
  timezone: string;
  status: BranchStatus;
  statusReason?: string;
  capacity?: number;
  coordinates?: BranchCoordinates;
  serviceModes: Array<'dine_in' | 'takeaway' | 'delivery'>;
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

const branchSchema = new mongoose.Schema<BranchDocument>(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
      index: true,
    },
    tenantId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    code: { type: String, required: true, uppercase: true, trim: true, maxlength: 20 },
    address: {
      label: { type: String, default: 'Branch Location' },
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
    phone: { type: String, required: true, trim: true },
    email: { type: String, lowercase: true, trim: true },
    managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    businessHours: [dayBusinessHoursSchema],
    timezone: { type: String, default: 'Asia/Kolkata' },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'TEMPORARILY_CLOSED'],
      default: 'ACTIVE',
    },
    statusReason: String,
    capacity: Number,
    coordinates: {
      latitude: Number,
      longitude: Number,
    },
    serviceModes: [
      {
        type: String,
        enum: ['dine_in', 'takeaway', 'delivery'],
        default: ['dine_in', 'takeaway'],
      },
    ],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

branchSchema.index({ restaurantId: 1, code: 1 }, { unique: true });
branchSchema.index({ tenantId: 1, status: 1 });

export const Branch =
  (mongoose.models.Branch as Model<BranchDocument>) || mongoose.model('Branch', branchSchema);
