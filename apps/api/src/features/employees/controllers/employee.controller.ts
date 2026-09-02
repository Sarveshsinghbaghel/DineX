import type { NextFunction, Request, Response } from 'express';
import { sendSuccessResponse } from '../../../utils/api-response';
import * as employeeService from '../services/employee.service';
import {
  createEmployeeSchema,
  createShiftSchema,
  clockInOutSchema,
  attendanceCorrectionSchema,
} from '@x10think/validation';

export async function createEmployee(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = createEmployeeSchema.parse(req.body);
    const result = await employeeService.createEmployee(body, req.user!);
    sendSuccessResponse(res, {
      statusCode: 201,
      message: 'Employee profile created.',
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

export async function getEmployee(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await employeeService.getEmployeeById(
      req.params.employeeId as string,
      req.user!,
    );
    sendSuccessResponse(res, { message: 'Employee profile retrieved.', data: result });
  } catch (err) {
    next(err);
  }
}

export async function updateEmployeeStatus(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await employeeService.updateEmployeeStatus(
      req.params.employeeId as string,
      req.body.status,
      req.user!,
    );
    sendSuccessResponse(res, { message: 'Employee status updated.', data: result });
  } catch (err) {
    next(err);
  }
}

export async function listEmployees(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await employeeService.listEmployees(
      req.user!,
      req.query.branchId as string,
      req.query.search as string,
    );
    sendSuccessResponse(res, { message: 'Employees retrieved.', data: result });
  } catch (err) {
    next(err);
  }
}

export async function createShift(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = createShiftSchema.parse(req.body);
    const result = await employeeService.createShift(body, req.user!);
    sendSuccessResponse(res, {
      statusCode: 201,
      message: 'Shift scheduled successfully.',
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

export async function listShifts(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await employeeService.listShifts(
      req.user!,
      req.query.branchId as string,
      req.query.employeeId as string,
      req.query.date as string,
    );
    sendSuccessResponse(res, { message: 'Shifts retrieved.', data: result });
  } catch (err) {
    next(err);
  }
}

export async function clockIn(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = clockInOutSchema.parse(req.body);
    const result = await employeeService.clockIn(body, req.user!);
    sendSuccessResponse(res, { statusCode: 201, message: 'Clock-in recorded.', data: result });
  } catch (err) {
    next(err);
  }
}

export async function clockOut(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = clockInOutSchema.parse(req.body);
    const result = await employeeService.clockOut(body, req.user!);
    sendSuccessResponse(res, { message: 'Clock-out recorded.', data: result });
  } catch (err) {
    next(err);
  }
}

export async function correctAttendance(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = attendanceCorrectionSchema.parse(req.body);
    const result = await employeeService.correctAttendance(
      req.params.attendanceId as string,
      body,
      req.user!,
    );
    sendSuccessResponse(res, { message: 'Attendance record corrected.', data: result });
  } catch (err) {
    next(err);
  }
}

export async function listAttendance(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await employeeService.listAttendance(
      req.user!,
      req.query.branchId as string,
      req.query.date as string,
    );
    sendSuccessResponse(res, { message: 'Attendance records retrieved.', data: result });
  } catch (err) {
    next(err);
  }
}
