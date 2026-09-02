import mongoose, { type Document, type Model } from 'mongoose';

export interface RatingDocument extends Document {
  tenantId: string;
  branchId: mongoose.Types.ObjectId;
  customerId: mongoose.Types.ObjectId;
  orderId: mongoose.Types.ObjectId;
  overallScore: number;
  dimensions?: {
    food?: number;
    service?: number;
    ambience?: number;
    delivery?: number;
  };
  status: 'active' | 'hidden' | 'withdrawn';
  submittedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ratingSchema = new mongoose.Schema<RatingDocument>(
  {
    tenantId: { type: String, required: true, index: true },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true, index: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, required: true },
    overallScore: { type: Number, required: true, min: 1, max: 5 },
    dimensions: {
      food: { type: Number, min: 1, max: 5 },
      service: { type: Number, min: 1, max: 5 },
      ambience: { type: Number, min: 1, max: 5 },
      delivery: { type: Number, min: 1, max: 5 },
    },
    status: {
      type: String,
      enum: ['active', 'hidden', 'withdrawn'],
      default: 'active',
    },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

ratingSchema.index({ tenantId: 1, customerId: 1, orderId: 1 }, { unique: true });
ratingSchema.index({ tenantId: 1, branchId: 1, overallScore: 1 });

export const Rating =
  (mongoose.models.Rating as Model<RatingDocument>) || mongoose.model('Rating', ratingSchema);
