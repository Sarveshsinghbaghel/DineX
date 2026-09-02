import mongoose, { type Document, type Model } from 'mongoose';
import type { ReviewStatus } from '@x10think/types';

export interface ReviewDocument extends Document {
  tenantId: string;
  branchId: mongoose.Types.ObjectId;
  customerId: mongoose.Types.ObjectId;
  customerName?: string;
  orderId: mongoose.Types.ObjectId;
  title?: string;
  content: string;
  rating?: number;
  status: ReviewStatus;
  moderationReason?: string;
  submittedAt: Date;
  response?: string;
  respondedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new mongoose.Schema<ReviewDocument>(
  {
    tenantId: { type: String, required: true, index: true },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true, index: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    customerName: String,
    orderId: { type: mongoose.Schema.Types.ObjectId, required: true },
    title: { type: String, trim: true, maxlength: 100 },
    content: { type: String, required: true, trim: true, minlength: 10, maxlength: 2000 },
    rating: { type: Number, min: 1, max: 5 },
    status: {
      type: String,
      enum: ['pending', 'published', 'hidden', 'rejected'],
      default: 'pending',
    },
    moderationReason: String,
    submittedAt: { type: Date, default: Date.now },
    response: String,
    respondedAt: Date,
  },
  { timestamps: true },
);

reviewSchema.index({ tenantId: 1, customerId: 1, orderId: 1 }, { unique: true });
reviewSchema.index({ tenantId: 1, branchId: 1, status: 1, submittedAt: -1 });

export const Review =
  (mongoose.models.Review as Model<ReviewDocument>) || mongoose.model('Review', reviewSchema);
