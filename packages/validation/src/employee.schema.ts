import { z } from 'zod';

export const createEmployeeSchema = z
  .object({
    userId: z.string().min(1, 'Target User ID is required'),
    employeeNumber: z
      .string()
      .min(2, 'Employee Number is required')
      .max(20)
      .transform((val) => val.toUpperCase()),
    employmentStatus: z.enum(['active', 'on_leave', 'suspended', 'terminated']).default('active'),
    employmentType: z
      .enum(['full_time', 'part_time', 'contract', 'temporary'])
      .default('full_time'),
    primaryBranchId: z.string().min(1, 'Primary Branch ID is required'),
    branchIds: z.array(z.string()).min(1, 'At least primary branch ID must be listed'),
    jobTitle: z.string().max(100).optional(),
    department: z.string().max(50).optional(),
    managerEmployeeId: z.string().optional(),
    emergencyContact: z
      .object({
        name: z.string().min(2).max(100),
        relationship: z.string().min(2).max(50),
        phone: z.string().min(5).max(20),
      })
      .optional(),
    joinedAt: z.string().default(() => new Date().toISOString()),
  })
  .strict();

export const updateEmployeeSchema = createEmployeeSchema.partial().omit({ userId: true }).strict();

export const createShiftSchema = z
  .object({
    branchId: z.string().min(1, 'Branch ID is required'),
    employeeId: z.string().min(1, 'Employee ID is required'),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format'),
    startTime: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Start time must be HH:mm 24-hr format'),
    endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'End time must be HH:mm 24-hr format'),
    status: z.enum(['scheduled', 'completed', 'cancelled']).default('scheduled'),
    notes: z.string().max(250).optional(),
  })
  .strict();

export const clockInOutSchema = z
  .object({
    employeeId: z.string().min(1, 'Employee ID is required'),
    branchId: z.string().min(1, 'Branch ID is required'),
    notes: z.string().max(250).optional(),
  })
  .strict();

export const attendanceCorrectionSchema = z
  .object({
    status: z.enum(['scheduled', 'present', 'late', 'absent', 'on_leave', 'completed']),
    clockInAt: z.string().optional(),
    clockOutAt: z.string().optional(),
    breakMinutes: z.number().int().nonnegative().optional(),
    notes: z.string().max(250).optional(),
  })
  .strict();

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
export type CreateShiftInput = z.infer<typeof createShiftSchema>;
export type ClockInOutInput = z.infer<typeof clockInOutSchema>;
export type AttendanceCorrectionInput = z.infer<typeof attendanceCorrectionSchema>;
