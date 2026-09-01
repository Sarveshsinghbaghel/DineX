import mongoose, { type Document, type Model } from 'mongoose';

export interface AuditLogDocument extends Document {
  tenantId?: string;
  actorId: mongoose.Types.ObjectId | string;
  action: string;
  targetType: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

const auditLogSchema = new mongoose.Schema<AuditLogDocument>(
  {
    tenantId: { type: String, index: true },
    actorId: { type: mongoose.Schema.Types.Mixed, required: true, index: true },
    action: { type: String, required: true, index: true },
    targetType: { type: String, required: true, index: true },
    targetId: { type: String, index: true },
    metadata: { type: mongoose.Schema.Types.Mixed },
    ipAddress: { type: String },
    userAgent: { type: String },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { timestamps: false },
);

export const AuditLog =
  (mongoose.models.AuditLog as Model<AuditLogDocument>) ||
  mongoose.model<AuditLogDocument>('AuditLog', auditLogSchema);
