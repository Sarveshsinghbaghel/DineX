import mongoose, { type Document, type Model } from 'mongoose';
import type { PermissionScope } from '@x10think/types';

export interface PermissionDocument extends Document {
  code: string;
  module: string;
  action: string;
  scope: PermissionScope;
  status: 'active' | 'inactive';
  description?: string;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const permissionSchema = new mongoose.Schema<PermissionDocument>(
  {
    code: { type: String, required: true, unique: true, trim: true, lowercase: true },
    module: { type: String, required: true, trim: true, lowercase: true },
    action: { type: String, required: true, trim: true, lowercase: true },
    scope: {
      type: String,
      enum: ['own', 'branch', 'restaurant', 'tenant', 'platform'],
      default: 'tenant',
    },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    description: { type: String, trim: true, maxlength: 500 },
    isSystem: { type: Boolean, default: true },
  },
  { timestamps: true },
);

permissionSchema.index({ code: 1 }, { unique: true });
permissionSchema.index({ module: 1, action: 1 });

export const Permission =
  (mongoose.models.Permission as Model<PermissionDocument>) ||
  mongoose.model<PermissionDocument>('Permission', permissionSchema);
