import mongoose, { type Document, type Model } from 'mongoose';

export interface LoyaltyTransactionDocument extends Document {
  tenantId: string;
  customerId: mongoose.Types.ObjectId;
  type: 'earn' | 'redeem' | 'expire' | 'adjustment';
  points: number;
  balanceAfter: number;
  sourceType: string;
  sourceId: string;
  reason?: string;
  createdAt: Date;
}

const loyaltyTransactionSchema = new mongoose.Schema<LoyaltyTransactionDocument>(
  {
    tenantId: { type: String, required: true, index: true },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['earn', 'redeem', 'expire', 'adjustment'],
      required: true,
    },
    points: { type: Number, required: true },
    balanceAfter: { type: Number, required: true, min: 0 },
    sourceType: { type: String, required: true, default: 'manual' },
    sourceId: { type: String, required: true },
    reason: String,
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

loyaltyTransactionSchema.index({ tenantId: 1, customerId: 1, createdAt: -1 });

export const LoyaltyTransaction =
  (mongoose.models.LoyaltyTransaction as Model<LoyaltyTransactionDocument>) ||
  mongoose.model('LoyaltyTransaction', loyaltyTransactionSchema);
