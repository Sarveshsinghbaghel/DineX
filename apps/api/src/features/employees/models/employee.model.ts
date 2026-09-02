import mongoose, { type Document, type Model } from 'mongoose';
import type { EmploymentStatus, EmploymentType } from '@x10think/types';

export interface EmployeeDocument extends Document {
  tenantId: string;
  userId: mongoose.Types.ObjectId;
  employeeNumber: string;
  employmentStatus: EmploymentStatus;
  employmentType: EmploymentType;
  primaryBranchId: mongoose.Types.ObjectId;
  branchIds: mongoose.Types.ObjectId[];
  jobTitle?: string;
  department?: string;
  managerEmployeeId?: mongoose.Types.ObjectId;
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  joinedAt: Date;
  terminatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const employeeSchema = new mongoose.Schema<EmployeeDocument>(
  {
    tenantId: { type: String, required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    employeeNumber: { type: String, required: true, uppercase: true, trim: true, maxlength: 20 },
    employmentStatus: {
      type: String,
      enum: ['active', 'on_leave', 'suspended', 'terminated'],
      default: 'active',
    },
    employmentType: {
      type: String,
      enum: ['full_time', 'part_time', 'contract', 'temporary'],
      default: 'full_time',
    },
    primaryBranchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: true,
      index: true,
    },
    branchIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Branch' }],
    jobTitle: { type: String, trim: true, maxlength: 100 },
    department: { type: String, trim: true, maxlength: 50 },
    managerEmployeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
    emergencyContact: {
      name: String,
      relationship: String,
      phone: String,
    },
    joinedAt: { type: Date, default: Date.now },
    terminatedAt: Date,
  },
  { timestamps: true },
);

employeeSchema.index({ tenantId: 1, employeeNumber: 1 }, { unique: true });
employeeSchema.index({ tenantId: 1, primaryBranchId: 1, employmentStatus: 1 });

export const Employee =
  (mongoose.models.Employee as Model<EmployeeDocument>) ||
  mongoose.model('Employee', employeeSchema);
