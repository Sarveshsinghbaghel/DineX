import mongoose, { type Document, type Model } from 'mongoose';

export interface ShiftDocument extends Document {
  tenantId: string;
  branchId: mongoose.Types.ObjectId;
  employeeId: mongoose.Types.ObjectId;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const shiftSchema = new mongoose.Schema<ShiftDocument>(
  {
    tenantId: { type: String, required: true, index: true },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true, index: true },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true,
    },
    date: { type: String, required: true, index: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'cancelled'],
      default: 'scheduled',
    },
    notes: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

shiftSchema.index({ tenantId: 1, branchId: 1, employeeId: 1, date: 1, startTime: 1 });

export const Shift =
  (mongoose.models.Shift as Model<ShiftDocument>) || mongoose.model('Shift', shiftSchema);
