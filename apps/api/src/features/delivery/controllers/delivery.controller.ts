import type { NextFunction, Request, Response } from 'express';
import { sendSuccessResponse } from '../../../utils/api-response';
import * as addressService from '../services/delivery-address.service';
import * as feeService from '../services/delivery-fee.service';
import * as fulfillmentService from '../services/delivery-fulfillment.service';
import {
  deliveryAddressCreateSchema,
  deliveryServiceabilitySchema,
  deliveryCheckoutSchema,
  deliveryAssignDriverSchema,
  deliveryStatusUpdateSchema,
} from '@x10think/validation';

export async function addAddress(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = deliveryAddressCreateSchema.parse(req.body);
    const result = await addressService.addCustomerDeliveryAddress(req.user!, body);
    sendSuccessResponse(res, { statusCode: 201, message: 'Address saved.', data: result });
  } catch (err) {
    next(err);
  }
}

export async function listAddresses(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await addressService.listCustomerDeliveryAddresses(req.user!);
    sendSuccessResponse(res, { message: 'Addresses listed.', data: result });
  } catch (err) {
    next(err);
  }
}

export async function deleteAddress(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const addressId = String(req.params.addressId);
    await addressService.deleteCustomerDeliveryAddress(req.user!, addressId);
    sendSuccessResponse(res, { message: 'Address deleted.', data: null });
  } catch (err) {
    next(err);
  }
}

export async function checkServiceability(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = deliveryServiceabilitySchema.parse(req.body);
    const result = await feeService.checkDeliveryServiceability(body);
    sendSuccessResponse(res, { message: 'Serviceability checked.', data: result });
  } catch (err) {
    next(err);
  }
}

export async function checkoutDeliveryOrder(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = deliveryCheckoutSchema.parse(req.body);
    const result = await fulfillmentService.checkoutDeliveryOrder(body, req.user);
    sendSuccessResponse(res, {
      statusCode: 201,
      message: 'Delivery order placed successfully.',
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

export async function getDeliveryOrderStatus(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const orderId = String(req.params.orderId);
    const result = await fulfillmentService.getDeliveryOrderStatus(orderId, req.user);
    sendSuccessResponse(res, { message: 'Delivery order status retrieved.', data: result });
  } catch (err) {
    next(err);
  }
}

export async function assignDeliveryDriver(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const orderId = String(req.params.orderId);
    const body = deliveryAssignDriverSchema.parse(req.body);
    const result = await fulfillmentService.assignDeliveryDriver(orderId, body.employeeId, req.user!);
    sendSuccessResponse(res, { message: 'Delivery driver assigned.', data: result });
  } catch (err) {
    next(err);
  }
}

export async function updateDeliveryStatus(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const orderId = String(req.params.orderId);
    const body = deliveryStatusUpdateSchema.parse(req.body);
    const result = await fulfillmentService.updateDeliveryStatus(orderId, body, req.user!);
    sendSuccessResponse(res, { message: 'Delivery status updated.', data: result });
  } catch (err) {
    next(err);
  }
}

export async function listStaffDeliveryOrders(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const branchId = String(req.params.branchId);
    const result = await fulfillmentService.listStaffDeliveryOrders(branchId, req.user!);
    sendSuccessResponse(res, { message: 'Staff delivery orders listed.', data: result });
  } catch (err) {
    next(err);
  }
}

export async function listDriverAssignedDeliveries(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await fulfillmentService.listDriverAssignedDeliveries(req.user!);
    sendSuccessResponse(res, { message: 'Driver assigned deliveries listed.', data: result });
  } catch (err) {
    next(err);
  }
}

export async function listAvailableDrivers(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const branchId = String(req.params.branchId);
    const result = await fulfillmentService.listAvailableDeliveryDrivers(branchId, req.user!);
    sendSuccessResponse(res, { message: 'Available drivers listed.', data: result });
  } catch (err) {
    next(err);
  }
}
