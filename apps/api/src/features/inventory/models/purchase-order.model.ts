import mongoose, { type Document, type Model } from 'mongoose';
import type { PurchaseOrderStatus, IngredientUnit } from '@x10think/types';

export interface PurchaseOrderDocument extends Document {
  tenantId: string;
  branchId: mongoose.Types.ObjectId;
  supplierId: mongoose.Types.ObjectId;
  poNumber: string;
  status: PurchaseOrderStatus;
  currency: string;
  items: Array<{
    ingredientId: mongoose.Types.ObjectId;
    ingredientName?: string;
    orderedQuantity: number;
    receivedQuantity: number;
    unit: IngredientUnit;
    unitCost: number;
    taxRate?: number;
    lineTotal: number;
  }>;
  createdByEmployeeId?: mongoose.Types.ObjectId;
  orderedAt: Date;
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  expectedDeliveryAt?: Date;
  receivedAt?: Date;
  notes?: string;
  taxTotal?: number;
  discountTotal?: number;
  grandTotal: number;
  createdAt: Date;
  updatedAt: Date;
}

const purchaseOrderSchema = new mongoose.Schema<PurchaseOrderDocument>(
  {
    tenantId: { type: String, required: true, index: true },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true, index: true },
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      required: true,
      index: true,
    },
    poNumber: { type: String, required: true, uppercase: true, trim: true },
    status: {
      type: String,
      enum: [
        'draft',
        'pending_approval',
        'approved',
        'sent',
        'partially_received',
        'received',
        'cancelled',
        'closed',
      ],
      default: 'draft',
    },
    currency: { type: String, default: 'INR' },
    items: [
      {
        ingredientId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Ingredient',
          required: true,
        },
        ingredientName: String,
        orderedQuantity: { type: Number, required: true, min: 0.01 },
        receivedQuantity: { type: Number, default: 0, min: 0 },
        unit: { type: String, enum: ['g', 'kg', 'ml', 'l', 'unit', 'pack'], required: true },
        unitCost: { type: Number, required: true, min: 0 },
        taxRate: { type: Number, default: 0 },
        lineTotal: { type: Number, required: true, min: 0 },
      },
    ],
    createdByEmployeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
    orderedAt: { type: Date, default: Date.now },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: Date,
    expectedDeliveryAt: Date,
    receivedAt: Date,
    notes: String,
    taxTotal: { type: Number, default: 0 },
    discountTotal: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true, min: 0 },
  },
  { timestamps: true },
);

purchaseOrderSchema.index({ tenantId: 1, branchId: 1, poNumber: 1 }, { unique: true });
purchaseOrderSchema.index({ tenantId: 1, supplierId: 1, status: 1 });

export const PurchaseOrder =
  (mongoose.models.PurchaseOrder as Model<PurchaseOrderDocument>) ||
  mongoose.model('PurchaseOrder', purchaseOrderSchema);
