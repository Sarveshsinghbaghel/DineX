import mongoose, { type Document, type Model } from 'mongoose';
import type { AttendanceStatus } from '@x10think/types';

export interface AttendanceDocument extends Document {
  tenantId: string;
  employeeId: mongoose.Types.ObjectId;
  branchId: mongoose.Types.ObjectId;
  workDate: string; // YYYY-MM-DD
  status: AttendanceStatus;
  scheduledStartAt?: Date;
  scheduledEndAt?: Date;
  clockInAt?: Date;
  clockOutAt?: Date;
  breakMinutes: number;
  notes?: string;
  approvedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const attendanceSchema = new mongoose.Schema<AttendanceDocument>(
  {
    tenantId: { type: String, required: true, index: true },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true,
    },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true, index: true },
    workDate: { type: String, required: true, index: true },
    status: {
      type: String,
      enum: ['scheduled', 'present', 'late', 'absent', 'on_leave', 'completed'],
      default: 'scheduled',
    },
    scheduledStartAt: Date,
    scheduledEndAt: Date,
    clockInAt: Date,
    clockOutAt: Date,
    breakMinutes: { type: Number, default: 0, min: 0 },
    notes: String,
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

attendanceSchema.index({ tenantId: 1, employeeId: 1, workDate: 1 }, { unique: true });
attendanceSchema.index({ tenantId: 1, branchId: 1, workDate: 1, status: 1 });

export const Attendance =
  (mongoose.models.Attendance as Model<AttendanceDocument>) ||
  mongoose.model('Attendance', attendanceSchema);
