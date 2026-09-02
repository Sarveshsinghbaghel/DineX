import mongoose, { type Document, type Model } from 'mongoose';
import type { IngredientUnit, StockTransactionType } from '@x10think/types';

export interface StockTransactionDocument extends Document {
  tenantId: string;
  branchId: mongoose.Types.ObjectId;
  ingredientId: mongoose.Types.ObjectId;
  transactionType: StockTransactionType;
  quantityDelta: number;
  unit: IngredientUnit;
  occurredAt: Date;
  balanceAfter: number;
  sourceType: string;
  sourceId: string;
  unitCost?: number;
  reason?: string;
  purchaseOrderId?: mongoose.Types.ObjectId;
  orderId?: mongoose.Types.ObjectId;
  performedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
}

const stockTransactionSchema = new mongoose.Schema<StockTransactionDocument>(
  {
    tenantId: { type: String, required: true, index: true },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true, index: true },
    ingredientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ingredient',
      required: true,
      index: true,
    },
    transactionType: {
      type: String,
      enum: [
        'stock_in',
        'stock_out',
        'purchase_receipt',
        'order_consumption',
        'waste',
        'adjustment_in',
        'adjustment_out',
        'return_to_supplier',
        'transfer_in',
        'transfer_out',
        'stock_count',
      ],
      required: true,
    },
    quantityDelta: { type: Number, required: true },
    unit: { type: String, enum: ['g', 'kg', 'ml', 'l', 'unit', 'pack'], required: true },
    occurredAt: { type: Date, default: Date.now },
    balanceAfter: { type: Number, required: true, min: 0 },
    sourceType: { type: String, required: true, default: 'manual_adjustment' },
    sourceId: { type: String, required: true },
    unitCost: Number,
    reason: String,
    purchaseOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'PurchaseOrder' },
    orderId: mongoose.Schema.Types.ObjectId,
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

stockTransactionSchema.index({ tenantId: 1, branchId: 1, ingredientId: 1, occurredAt: -1 });

export const StockTransaction =
  (mongoose.models.StockTransaction as Model<StockTransactionDocument>) ||
  mongoose.model('StockTransaction', stockTransactionSchema);
