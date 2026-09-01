import mongoose, { type Document, type Model } from 'mongoose';

export interface RoleDocument extends Document {
  tenantId?: string;
  name: string;
  code: string;
  description?: string;
  permissionIds: mongoose.Types.ObjectId[];
  status: 'active' | 'inactive';
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const roleSchema = new mongoose.Schema<RoleDocument>(
  {
    tenantId: { type: String, index: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    code: { type: String, required: true, trim: true, lowercase: true },
    description: { type: String, trim: true, maxlength: 500 },
    permissionIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Permission' }],
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    isSystem: { type: Boolean, default: false },
  },
  { timestamps: true },
);

roleSchema.index({ tenantId: 1, code: 1 }, { unique: true });
roleSchema.index({ tenantId: 1, name: 1 });

export const Role =
  (mongoose.models.Role as Model<RoleDocument>) || mongoose.model<RoleDocument>('Role', roleSchema);
