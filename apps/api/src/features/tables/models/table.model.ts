import mongoose, { type Document, type Model } from 'mongoose';
import type { TableStatus, QRTokenStatus } from '@x10think/types';

export interface TableDocument extends Document {
  tenantId: string;
  branchId: mongoose.Types.ObjectId;
  tableNumber: string;
  capacity: number;
  section: string;
  status: TableStatus;
  qrToken: string;
  qrStatus: QRTokenStatus;
  createdAt: Date;
  updatedAt: Date;
}

const tableSchema = new mongoose.Schema<TableDocument>(
  {
    tenantId: { type: String, required: true, index: true },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true, index: true },
    tableNumber: { type: String, required: true, trim: true },
    capacity: { type: Number, required: true, default: 4, min: 1 },
    section: { type: String, required: true, default: 'Main Dining', trim: true },
    status: {
      type: String,
      enum: ['available', 'occupied', 'reserved', 'cleaning', 'maintenance'],
      default: 'available',
    },
    qrToken: { type: String, required: true, unique: true, index: true },
    qrStatus: { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: true },
);

tableSchema.index({ tenantId: 1, branchId: 1, tableNumber: 1 }, { unique: true });

export const Table =
  (mongoose.models.Table as Model<TableDocument>) || mongoose.model('Table', tableSchema);
