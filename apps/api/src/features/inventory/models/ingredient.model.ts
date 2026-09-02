import mongoose, { type Document, type Model } from 'mongoose';
import type { IngredientUnit, IngredientStatus } from '@x10think/types';

export interface IngredientDocument extends Document {
  tenantId: string;
  name: string;
  sku: string;
  baseUnit: IngredientUnit;
  category?: string;
  preferredSupplierId?: mongoose.Types.ObjectId;
  reorderUnit?: IngredientUnit;
  allergenInfo?: string[];
  yieldFactor: number;
  status: IngredientStatus;
  createdAt: Date;
  updatedAt: Date;
}

const ingredientSchema = new mongoose.Schema<IngredientDocument>(
  {
    tenantId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    sku: { type: String, required: true, uppercase: true, trim: true, maxlength: 30 },
    baseUnit: {
      type: String,
      enum: ['g', 'kg', 'ml', 'l', 'unit', 'pack'],
      required: true,
    },
    category: { type: String, trim: true, maxlength: 50 },
    preferredSupplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
    reorderUnit: { type: String, enum: ['g', 'kg', 'ml', 'l', 'unit', 'pack'] },
    allergenInfo: [{ type: String }],
    yieldFactor: { type: Number, default: 1.0, min: 0.01, max: 1.0 },
    status: {
      type: String,
      enum: ['active', 'inactive', 'archived'],
      default: 'active',
    },
  },
  { timestamps: true },
);

ingredientSchema.index({ tenantId: 1, sku: 1 }, { unique: true });
ingredientSchema.index({ tenantId: 1, name: 1, baseUnit: 1 });

export const Ingredient =
  (mongoose.models.Ingredient as Model<IngredientDocument>) ||
  mongoose.model('Ingredient', ingredientSchema);
