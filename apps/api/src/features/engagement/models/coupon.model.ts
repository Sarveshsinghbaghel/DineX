import mongoose, { type Document, type Model } from 'mongoose';
import type { CouponDiscountType } from '@x10think/types';

export interface CouponDocument extends Document {
  tenantId: string;
  code: string;
  discountType: CouponDiscountType;
  value: number;
  startsAt: Date;
  endsAt: Date;
  minimumOrderAmount?: number;
  maximumDiscountAmount?: number;
  usageLimit?: number;
  usageCount: number;
  perCustomerLimit: number;
  branchIds?: mongoose.Types.ObjectId[];
  status: 'draft' | 'active' | 'inactive' | 'expired';
  createdAt: Date;
  updatedAt: Date;
}

const couponSchema = new mongoose.Schema<CouponDocument>(
  {
    tenantId: { type: String, required: true, index: true },
    code: { type: String, required: true, uppercase: true, trim: true },
    discountType: { type: String, enum: ['percentage', 'fixed_amount'], required: true },
    value: { type: Number, required: true, positive: true },
    startsAt: { type: Date, required: true },
    endsAt: { type: Date, required: true },
    minimumOrderAmount: { type: Number, min: 0 },
    maximumDiscountAmount: { type: Number, min: 0 },
    usageLimit: { type: Number, min: 1 },
    usageCount: { type: Number, default: 0, min: 0 },
    perCustomerLimit: { type: Number, default: 1, min: 1 },
    branchIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Branch' }],
    status: {
      type: String,
      enum: ['draft', 'active', 'inactive', 'expired'],
      default: 'active',
    },
  },
  { timestamps: true },
);

couponSchema.index({ tenantId: 1, code: 1 }, { unique: true });

export const Coupon =
  (mongoose.models.Coupon as Model<CouponDocument>) || mongoose.model('Coupon', couponSchema);

export interface CouponUsageDocument extends Document {
  tenantId: string;
  couponId: mongoose.Types.ObjectId;
  orderId: mongoose.Types.ObjectId;
  customerId: mongoose.Types.ObjectId;
  codeSnapshot: string;
  discountAmount: number;
  usedAt: Date;
  status: 'applied' | 'reversed' | 'voided';
}

const couponUsageSchema = new mongoose.Schema<CouponUsageDocument>(
  {
    tenantId: { type: String, required: true, index: true },
    couponId: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon', required: true, index: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    codeSnapshot: { type: String, required: true },
    discountAmount: { type: Number, required: true, min: 0 },
    usedAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['applied', 'reversed', 'voided'], default: 'applied' },
  },
  { timestamps: true },
);

couponUsageSchema.index({ tenantId: 1, couponId: 1, customerId: 1 });

export const CouponUsage =
  (mongoose.models.CouponUsage as Model<CouponUsageDocument>) ||
  mongoose.model('CouponUsage', couponUsageSchema);
