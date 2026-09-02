import mongoose, { type Document, type Model } from 'mongoose';
import type { ReportType, ReportExportFormat } from '@x10think/types';

export interface ReportHistoryDocument extends Document {
  tenantId: string;
  branchId?: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  reportType: ReportType;
  format: ReportExportFormat;
  dateRangeLabel: string;
  rowCount: number;
  status: 'completed' | 'failed';
  generatedAt: Date;
}

const reportHistorySchema = new mongoose.Schema<ReportHistoryDocument>(
  {
    tenantId: { type: String, required: true, index: true },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    reportType: { type: String, required: true },
    format: { type: String, enum: ['csv', 'xlsx', 'pdf'], required: true },
    dateRangeLabel: { type: String, required: true },
    rowCount: { type: Number, default: 0 },
    status: { type: String, enum: ['completed', 'failed'], default: 'completed' },
    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

reportHistorySchema.index({ tenantId: 1, userId: 1, generatedAt: -1 });

export const ReportHistory =
  (mongoose.models.ReportHistory as Model<ReportHistoryDocument>) ||
  mongoose.model('ReportHistory', reportHistorySchema);
