import type { NextFunction, Request, Response } from 'express';
import { sendSuccessResponse } from '../../../utils/api-response';
import * as qrTokenService from '../services/qr-token.service';
import * as qrMenuService from '../services/qr-menu.service';
import * as qrCheckoutService from '../services/qr-checkout.service';
import * as qrStatusService from '../services/qr-status.service';
import { tableCreateSchema, qrTokenStatusSchema, qrCheckoutSchema } from '@x10think/validation';

export async function validateQRToken(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const token = String(req.params.token);
    const result = await qrTokenService.validateQRToken(token);
    sendSuccessResponse(res, { message: 'QR token validated successfully.', data: result });
  } catch (err) {
    next(err);
  }
}

export async function getPublicQRMenu(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const token = String(req.params.token);
    const result = await qrMenuService.getPublicQRMenu(token);
    sendSuccessResponse(res, { message: 'Public QR menu retrieved.', data: result });
  } catch (err) {
    next(err);
  }
}

export async function checkoutQROrder(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const token = String(req.params.token);
    const body = qrCheckoutSchema.parse({ ...req.body, token });
    const result = await qrCheckoutService.checkoutQROrder(body, req.user);
    sendSuccessResponse(res, {
      statusCode: 201,
      message: 'QR order placed successfully.',
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

export async function getQROrderStatus(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const orderId = String(req.params.orderId);
    const result = await qrStatusService.getQROrderStatus(orderId);
    sendSuccessResponse(res, { message: 'QR order status retrieved.', data: result });
  } catch (err) {
    next(err);
  }
}

export async function createTable(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = tableCreateSchema.parse(req.body);
    const result = await qrTokenService.createTable(body, req.user!);
    sendSuccessResponse(res, { statusCode: 201, message: 'Table created.', data: result });
  } catch (err) {
    next(err);
  }
}

export async function listTablesByBranch(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const branchId = String(req.params.branchId);
    const result = await qrTokenService.listTablesByBranch(branchId, req.user!);
    sendSuccessResponse(res, { message: 'Branch tables listed.', data: result });
  } catch (err) {
    next(err);
  }
}

export async function generateOrRegenerateQRToken(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const tableId = String(req.params.tableId);
    const result = await qrTokenService.generateOrRegenerateQRToken(tableId, req.user!);
    sendSuccessResponse(res, { message: 'Table QR token generated/regenerated.', data: result });
  } catch (err) {
    next(err);
  }
}

export async function setTableQRStatus(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const tableId = String(req.params.tableId);
    const body = qrTokenStatusSchema.parse(req.body);
    const result = await qrTokenService.setTableQRStatus(tableId, body.status, req.user!);
    sendSuccessResponse(res, {
      message: `Table QR token status updated to ${body.status}.`,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}
