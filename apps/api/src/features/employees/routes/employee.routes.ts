import { Router } from 'express';
import { requireAuth, requirePermission } from '../../../middlewares/authorization.middleware';
import * as controller from '../controllers/employee.controller';

export const employeeRouter = Router();

employeeRouter.use(requireAuth);

// Employees
employeeRouter.get('/', requirePermission('employees.view'), controller.listEmployees);
employeeRouter.post('/', requirePermission('employees.manage'), controller.createEmployee);
employeeRouter.get('/:employeeId', requirePermission('employees.view'), controller.getEmployee);
employeeRouter.patch(
  '/:employeeId/status',
  requirePermission('employees.manage'),
  controller.updateEmployeeStatus,
);

// Shifts
employeeRouter.get('/shifts/list', requirePermission('shifts.manage'), controller.listShifts);
employeeRouter.post('/shifts', requirePermission('shifts.manage'), controller.createShift);

// Attendance
employeeRouter.get(
  '/attendance/list',
  requirePermission('attendance.manage'),
  controller.listAttendance,
);
employeeRouter.post(
  '/attendance/clock-in',
  requirePermission('attendance.manage'),
  controller.clockIn,
);
employeeRouter.post(
  '/attendance/clock-out',
  requirePermission('attendance.manage'),
  controller.clockOut,
);
employeeRouter.patch(
  '/attendance/:attendanceId/correct',
  requirePermission('attendance.manage'),
  controller.correctAttendance,
);
