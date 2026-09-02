import mongoose, { type Document, type Model } from 'mongoose';

export interface SettingDocument extends Document {
  tenantId: string;
  scope: 'tenant' | 'branch';
  branchId?: mongoose.Types.ObjectId;
  key: string;
  value: unknown;
  valueType: 'string' | 'number' | 'boolean' | 'json';
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

const settingSchema = new mongoose.Schema<SettingDocument>(
  {
    tenantId: { type: String, required: true, index: true },
    scope: { type: String, enum: ['tenant', 'branch'], required: true },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', index: true },
    key: { type: String, required: true, trim: true },
    value: { type: mongoose.Schema.Types.Mixed, required: true },
    valueType: {
      type: String,
      enum: ['string', 'number', 'boolean', 'json'],
      default: 'string',
    },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: true },
);

settingSchema.index({ tenantId: 1, scope: 1, branchId: 1, key: 1 }, { unique: true });

export const Setting =
  (mongoose.models.Setting as Model<SettingDocument>) || mongoose.model('Setting', settingSchema);
