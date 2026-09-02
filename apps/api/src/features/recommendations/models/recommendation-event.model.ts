import mongoose, { type Document, type Model } from 'mongoose';
import type { RecommendationContext, RecommendationEventType } from '@x10think/types';

export interface RecommendationEventDocument extends Document {
  tenantId: string;
  branchId?: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  recommendationId?: string;
  context: RecommendationContext;
  menuItemId: string;
  eventType: RecommendationEventType;
  timestamp: Date;
}

const recommendationEventSchema = new mongoose.Schema<RecommendationEventDocument>(
  {
    tenantId: { type: String, required: true, index: true },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    recommendationId: { type: String },
    context: { type: String, required: true },
    menuItemId: { type: String, required: true, index: true },
    eventType: {
      type: String,
      enum: ['impression', 'click', 'add_to_cart', 'purchased', 'dismissed'],
      required: true,
    },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

recommendationEventSchema.index({ tenantId: 1, context: 1, eventType: 1 });

export const RecommendationEvent =
  (mongoose.models.RecommendationEvent as Model<RecommendationEventDocument>) ||
  mongoose.model('RecommendationEvent', recommendationEventSchema);
