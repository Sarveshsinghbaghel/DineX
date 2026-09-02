import mongoose, { type Document, type Model } from 'mongoose';
import type { IngredientUnit, InventoryStockState } from '@x10think/types';

export interface InventoryDocument extends Document {
  tenantId: string;
  branchId: mongoose.Types.ObjectId;
  ingredientId: mongoose.Types.ObjectId;
  currentQuantity: number;
  reservedQuantity: number;
  reorderLevel: number;
  minQuantity?: number;
  maxQuantity?: number;
  unit: IngredientUnit;
  averageUnitCost?: number;
  lastCountedAt?: Date;
  lastTransactionAt?: Date;
  storageLocation?: string;
  expirySummary?: string;
  status: 'active' | 'out_of_stock' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

const inventorySchema = new mongoose.Schema<InventoryDocument>(
  {
    tenantId: { type: String, required: true, index: true },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true, index: true },
    ingredientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ingredient',
      required: true,
      index: true,
    },
    currentQuantity: { type: Number, required: true, default: 0, min: 0 },
    reservedQuantity: { type: Number, default: 0, min: 0 },
    reorderLevel: { type: Number, required: true, default: 10, min: 0 },
    minQuantity: { type: Number, min: 0 },
    maxQuantity: { type: Number, min: 1 },
    unit: { type: String, enum: ['g', 'kg', 'ml', 'l', 'unit', 'pack'], required: true },
    averageUnitCost: { type: Number, min: 0 },
    lastCountedAt: Date,
    lastTransactionAt: Date,
    storageLocation: { type: String, trim: true, maxlength: 100 },
    expirySummary: String,
    status: {
      type: String,
      enum: ['active', 'out_of_stock', 'inactive'],
      default: 'active',
    },
  },
  { timestamps: true },
);

inventorySchema.index({ tenantId: 1, branchId: 1, ingredientId: 1 }, { unique: true });
inventorySchema.index({ tenantId: 1, branchId: 1, status: 1, currentQuantity: 1 });

export const Inventory =
  (mongoose.models.Inventory as Model<InventoryDocument>) ||
  mongoose.model('Inventory', inventorySchema);

export function deriveStockState(
  currentQuantity: number,
  reorderLevel: number,
  minQuantity?: number,
): InventoryStockState {
  if (currentQuantity <= 0) return 'OUT_OF_STOCK';
  const min = minQuantity ?? Math.floor(reorderLevel / 2);
  if (currentQuantity <= min) return 'CRITICAL';
  if (currentQuantity <= reorderLevel) return 'LOW';
  return 'HEALTHY';
}
