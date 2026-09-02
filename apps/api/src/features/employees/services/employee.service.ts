import mongoose from 'mongoose';
import { AppError } from '../../../errors/AppError';
import { Employee } from '../models/employee.model';
import { Shift } from '../models/shift.model';
import { Attendance } from '../models/attendance.model';
import { User } from '../../auth/models/auth.models';
import { logAuditEvent } from '../../audit-logs/services/audit-log.service';
import type {
  CreateEmployeeInput,
  CreateShiftInput,
  ClockInOutInput,
  AttendanceCorrectionInput,
} from '@x10think/validation';
import type { AttendanceStatus } from '@x10think/types';
import type { UserAuthContext } from '../../../middlewares/authorization.middleware';

function checkBranchScope(actor: UserAuthContext, branchId: string) {
  const isSuperAdmin = actor.roles.some((r) => r.code === 'super_admin');
  if (isSuperAdmin) return;

  const isManager = actor.roles.some((r) => r.code === 'manager');
  const isAdmin = actor.roles.some((r) => r.code === 'admin');

  if (isManager && !isAdmin && actor.branchIds && actor.branchIds.length > 0) {
    if (!actor.branchIds.includes(branchId)) {
      throw new AppError('Access denied: branch scope violation.', 403, 'BRANCH_SCOPE_DENIED');
    }
  }
}

// EMPLOYEES
export async function createEmployee(input: CreateEmployeeInput, actor: UserAuthContext) {
  const tenantId = actor.tenantId || 'tenant_default';
  if (
    !mongoose.Types.ObjectId.isValid(input.userId) ||
    !mongoose.Types.ObjectId.isValid(input.primaryBranchId)
  ) {
    throw new AppError('Invalid user or primary branch ID format.', 400, 'INVALID_ID');
  }

  const user = await User.findById(input.userId);
  if (!user) throw new AppError('Linked user account not found.', 404, 'USER_NOT_FOUND');

  const existingUserLink = await Employee.findOne({ userId: user._id });
  if (existingUserLink) {
    throw new AppError(
      'This user account is already linked to an active employee record.',
      409,
      'EMPLOYEE_USER_EXISTS',
    );
  }

  const existingNum = await Employee.findOne({ tenantId, employeeNumber: input.employeeNumber });
  if (existingNum) {
    throw new AppError(
      `Employee number '${input.employeeNumber}' already exists.`,
      409,
      'EMPLOYEE_NUMBER_EXISTS',
    );
  }

  const employee = await Employee.create({
    tenantId,
    userId: user._id,
    employeeNumber: input.employeeNumber,
    employmentStatus: input.employmentStatus,
    employmentType: input.employmentType,
    primaryBranchId: new mongoose.Types.ObjectId(input.primaryBranchId),
    branchIds: input.branchIds.map((b) => new mongoose.Types.ObjectId(b)),
    jobTitle: input.jobTitle,
    department: input.department,
    managerEmployeeId: input.managerEmployeeId
      ? new mongoose.Types.ObjectId(input.managerEmployeeId)
      : undefined,
    emergencyContact: input.emergencyContact,
    joinedAt: input.joinedAt ? new Date(input.joinedAt) : new Date(),
  });

  await logAuditEvent({
    tenantId,
    actorId: actor.userId,
    action: 'EMPLOYEE_CREATED',
    targetType: 'employee',
    targetId: employee.id,
    metadata: { employeeNumber: employee.employeeNumber, userId: user.id },
  });

  return employee;
}

export async function getEmployeeById(employeeId: string, actor: UserAuthContext) {
  if (!mongoose.Types.ObjectId.isValid(employeeId))
    throw new AppError('Invalid employee ID format.', 400, 'INVALID_ID');

  const employee = await Employee.findById(employeeId).populate('userId');
  if (!employee) throw new AppError('Employee record not found.', 404, 'EMPLOYEE_NOT_FOUND');

  checkBranchScope(actor, employee.primaryBranchId.toString());
  return employee;
}

export async function updateEmployeeStatus(
  employeeId: string,
  status: 'active' | 'on_leave' | 'suspended' | 'terminated',
  actor: UserAuthContext,
) {
  const employee = await getEmployeeById(employeeId, actor);

  employee.employmentStatus = status;
  if (status === 'terminated') {
    employee.terminatedAt = new Date();
  }

  await employee.save();

  await logAuditEvent({
    tenantId: employee.tenantId,
    actorId: actor.userId,
    action: 'EMPLOYEE_STATUS_CHANGED',
    targetType: 'employee',
    targetId: employee.id,
    metadata: { newStatus: status },
  });

  return employee;
}

export async function listEmployees(actor: UserAuthContext, branchId?: string, search?: string) {
  const filter: Record<string, unknown> = {};
  const isSuperAdmin = actor.roles.some((r) => r.code === 'super_admin');
  if (!isSuperAdmin && actor.tenantId) filter.tenantId = actor.tenantId;

  if (branchId && mongoose.Types.ObjectId.isValid(branchId)) {
    filter.branchIds = new mongoose.Types.ObjectId(branchId);
  }

  if (search) {
    const regex = new RegExp(search.trim(), 'i');
    filter.$or = [{ employeeNumber: regex }, { jobTitle: regex }, { department: regex }];
  }

  return Employee.find(filter).populate('userId').sort({ createdAt: -1 });
}

// SHIFTS
export async function createShift(input: CreateShiftInput, actor: UserAuthContext) {
  const tenantId = actor.tenantId || 'tenant_default';
  if (
    !mongoose.Types.ObjectId.isValid(input.branchId) ||
    !mongoose.Types.ObjectId.isValid(input.employeeId)
  ) {
    throw new AppError('Invalid branch or employee ID format.', 400, 'INVALID_ID');
  }

  checkBranchScope(actor, input.branchId);

  // Overlap check on same date for employee
  const existingShift = await Shift.findOne({
    tenantId,
    employeeId: new mongoose.Types.ObjectId(input.employeeId),
    date: input.date,
    status: { $ne: 'cancelled' },
    $or: [{ startTime: { $lt: input.endTime }, endTime: { $gt: input.startTime } }],
  });

  if (existingShift) {
    throw new AppError(
      'Shift schedule overlaps with an existing shift for this employee.',
      409,
      'SHIFT_OVERLAP_CONFLICT',
    );
  }

  const shift = await Shift.create({
    tenantId,
    branchId: new mongoose.Types.ObjectId(input.branchId),
    employeeId: new mongoose.Types.ObjectId(input.employeeId),
    date: input.date,
    startTime: input.startTime,
    endTime: input.endTime,
    status: input.status,
    notes: input.notes,
    createdBy: new mongoose.Types.ObjectId(actor.userId),
  });

  await logAuditEvent({
    tenantId,
    actorId: actor.userId,
    action: 'SHIFT_SCHEDULED',
    targetType: 'shift',
    targetId: shift.id,
    metadata: { date: shift.date, startTime: shift.startTime, endTime: shift.endTime },
  });

  return shift;
}

export async function listShifts(
  actor: UserAuthContext,
  branchId?: string,
  employeeId?: string,
  date?: string,
) {
  const filter: Record<string, unknown> = {};
  const isSuperAdmin = actor.roles.some((r) => r.code === 'super_admin');
  if (!isSuperAdmin && actor.tenantId) filter.tenantId = actor.tenantId;
  if (branchId && mongoose.Types.ObjectId.isValid(branchId))
    filter.branchId = new mongoose.Types.ObjectId(branchId);
  if (employeeId && mongoose.Types.ObjectId.isValid(employeeId))
    filter.employeeId = new mongoose.Types.ObjectId(employeeId);
  if (date) filter.date = date;

  return Shift.find(filter).populate('employeeId').sort({ date: 1, startTime: 1 });
}

// ATTENDANCE
export async function clockIn(input: ClockInOutInput, actor: UserAuthContext) {
  const tenantId = actor.tenantId || 'tenant_default';
  const workDate = new Date().toISOString().slice(0, 10);

  const employee = await Employee.findById(input.employeeId);
  if (!employee) throw new AppError('Employee not found.', 404, 'EMPLOYEE_NOT_FOUND');

  let attendance = await Attendance.findOne({
    tenantId,
    employeeId: employee._id,
    workDate,
  });

  if (attendance && attendance.clockInAt) {
    throw new AppError('Already clocked in for today.', 409, 'ATTENDANCE_ALREADY_CLOCKED_IN');
  }

  const clockInTime = new Date();
  const scheduledShift = await Shift.findOne({
    tenantId,
    employeeId: employee._id,
    date: workDate,
    status: 'scheduled',
  });

  let status: AttendanceStatus = 'present';
  if (scheduledShift) {
    const [sHours, sMins] = scheduledShift.startTime.split(':').map(Number);
    const scheduledStart = new Date(clockInTime);
    scheduledStart.setHours(sHours, sMins, 0, 0);

    if (clockInTime.getTime() > scheduledStart.getTime() + 15 * 60 * 1000) {
      status = 'late';
    }
  }

  if (attendance) {
    attendance.clockInAt = clockInTime;
    attendance.status = status;
    attendance.notes = input.notes || attendance.notes;
    await attendance.save();
  } else {
    attendance = await Attendance.create({
      tenantId,
      employeeId: employee._id,
      branchId: new mongoose.Types.ObjectId(input.branchId),
      workDate,
      status,
      clockInAt: clockInTime,
      notes: input.notes,
    });
  }

  await logAuditEvent({
    tenantId,
    actorId: actor.userId,
    action: 'ATTENDANCE_CLOCK_IN',
    targetType: 'attendance',
    targetId: attendance.id,
    metadata: { status, clockInAt: clockInTime },
  });

  return attendance;
}

export async function clockOut(input: ClockInOutInput, actor: UserAuthContext) {
  const tenantId = actor.tenantId || 'tenant_default';
  const workDate = new Date().toISOString().slice(0, 10);

  const attendance = await Attendance.findOne({
    tenantId,
    employeeId: new mongoose.Types.ObjectId(input.employeeId),
    workDate,
  });

  if (!attendance || !attendance.clockInAt) {
    throw new AppError(
      'Cannot clock out without prior clock-in.',
      409,
      'ATTENDANCE_NOT_CLOCKED_IN',
    );
  }

  attendance.clockOutAt = new Date();
  attendance.status = 'completed';
  if (input.notes) attendance.notes = input.notes;
  await attendance.save();

  await logAuditEvent({
    tenantId,
    actorId: actor.userId,
    action: 'ATTENDANCE_CLOCK_OUT',
    targetType: 'attendance',
    targetId: attendance.id,
  });

  return attendance;
}

export async function correctAttendance(
  attendanceId: string,
  input: AttendanceCorrectionInput,
  actor: UserAuthContext,
) {
  if (!mongoose.Types.ObjectId.isValid(attendanceId))
    throw new AppError('Invalid attendance ID format.', 400, 'INVALID_ID');

  const attendance = await Attendance.findById(attendanceId);
  if (!attendance) throw new AppError('Attendance record not found.', 404, 'ATTENDANCE_NOT_FOUND');

  if (input.status) attendance.status = input.status;
  if (input.clockInAt) attendance.clockInAt = new Date(input.clockInAt);
  if (input.clockOutAt) attendance.clockOutAt = new Date(input.clockOutAt);
  if (input.breakMinutes !== undefined) attendance.breakMinutes = input.breakMinutes;
  if (input.notes) attendance.notes = input.notes;
  attendance.approvedBy = new mongoose.Types.ObjectId(actor.userId);
  await attendance.save();

  await logAuditEvent({
    tenantId: attendance.tenantId,
    actorId: actor.userId,
    action: 'ATTENDANCE_CORRECTED',
    targetType: 'attendance',
    targetId: attendance.id,
  });

  return attendance;
}

export async function listAttendance(actor: UserAuthContext, branchId?: string, date?: string) {
  const filter: Record<string, unknown> = {};
  const isSuperAdmin = actor.roles.some((r) => r.code === 'super_admin');
  if (!isSuperAdmin && actor.tenantId) filter.tenantId = actor.tenantId;
  if (branchId && mongoose.Types.ObjectId.isValid(branchId))
    filter.branchId = new mongoose.Types.ObjectId(branchId);
  if (date) filter.workDate = date;

  return Attendance.find(filter).populate('employeeId').sort({ workDate: -1 });
}
