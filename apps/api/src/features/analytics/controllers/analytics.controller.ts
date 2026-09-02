import type { NextFunction, Request, Response } from 'express';
import { sendSuccessResponse } from '../../../utils/api-response';
import * as analyticsService from '../services/analytics.service';
import { analyticsQuerySchema } from '@x10think/validation';

export async function getDashboardSummary(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const query = analyticsQuerySchema.parse(req.query);
    const result = await analyticsService.getDashboardSummary(req.user!, query);
    sendSuccessResponse(res, { message: 'Dashboard KPI summary.', data: result });
  } catch (err) {
    next(err);
  }
}

export async function getRevenueAnalytics(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const query = analyticsQuerySchema.parse(req.query);
    const result = await analyticsService.getRevenueAnalytics(req.user!, query);
    sendSuccessResponse(res, { message: 'Revenue analytics.', data: result });
  } catch (err) {
    next(err);
  }
}

export async function getOrderAnalytics(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const query = analyticsQuerySchema.parse(req.query);
    const result = await analyticsService.getOrderAnalytics(req.user!, query);
    sendSuccessResponse(res, { message: 'Order analytics.', data: result });
  } catch (err) {
    next(err);
  }
}

export async function getMenuAnalytics(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const query = analyticsQuerySchema.parse(req.query);
    const result = await analyticsService.getMenuAnalytics(req.user!, query);
    sendSuccessResponse(res, { message: 'Menu performance analytics.', data: result });
  } catch (err) {
    next(err);
  }
}

export async function getCustomerAnalytics(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const query = analyticsQuerySchema.parse(req.query);
    const result = await analyticsService.getCustomerAnalytics(req.user!, query);
    sendSuccessResponse(res, { message: 'Customer analytics.', data: result });
  } catch (err) {
    next(err);
  }
}

export async function getReservationAnalytics(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const query = analyticsQuerySchema.parse(req.query);
    const result = await analyticsService.getReservationAnalytics(req.user!, query);
    sendSuccessResponse(res, { message: 'Reservation analytics.', data: result });
  } catch (err) {
    next(err);
  }
}

export async function getInventoryAnalytics(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const query = analyticsQuerySchema.parse(req.query);
    const result = await analyticsService.getInventoryAnalytics(req.user!, query);
    sendSuccessResponse(res, { message: 'Inventory analytics.', data: result });
  } catch (err) {
    next(err);
  }
}

export async function getEmployeeAnalytics(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const query = analyticsQuerySchema.parse(req.query);
    const result = await analyticsService.getEmployeeAnalytics(req.user!, query);
    sendSuccessResponse(res, { message: 'Employee analytics.', data: result });
  } catch (err) {
    next(err);
  }
}

export async function getPaymentAnalytics(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const query = analyticsQuerySchema.parse(req.query);
    const result = await analyticsService.getPaymentAnalytics(req.user!, query);
    sendSuccessResponse(res, { message: 'Payment analytics.', data: result });
  } catch (err) {
    next(err);
  }
}

export async function getBranchComparison(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const query = analyticsQuerySchema.parse(req.query);
    const result = await analyticsService.getBranchComparison(req.user!, query);
    sendSuccessResponse(res, { message: 'Branch comparison analytics.', data: result });
  } catch (err) {
    next(err);
  }
}
