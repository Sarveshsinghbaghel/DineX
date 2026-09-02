import mongoose, { type Document, type Model } from 'mongoose';

export interface FavoriteDocument extends Document {
  tenantId: string;
  customerId: mongoose.Types.ObjectId;
  menuItemId: string;
  branchId?: mongoose.Types.ObjectId;
  createdAt: Date;
}

const favoriteSchema = new mongoose.Schema<FavoriteDocument>(
  {
    tenantId: { type: String, required: true, index: true },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    menuItemId: { type: String, required: true, index: true },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

favoriteSchema.index({ tenantId: 1, customerId: 1, menuItemId: 1 }, { unique: true });

export const Favorite =
  (mongoose.models.Favorite as Model<FavoriteDocument>) ||
  mongoose.model('Favorite', favoriteSchema);
