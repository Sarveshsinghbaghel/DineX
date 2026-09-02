import type { NextFunction, Request, Response } from 'express';
import { sendSuccessResponse } from '../../../utils/api-response';
import * as inventoryService from '../services/inventory.service';
import * as poService from '../services/purchase-order.service';
import {
  createIngredientSchema,
  stockMutationSchema,
  initInventorySchema,
  createSupplierSchema,
  createPurchaseOrderSchema,
  receivePurchaseOrderSchema,
} from '@x10think/validation';

export async function createIngredient(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = createIngredientSchema.parse(req.body);
    const result = await inventoryService.createIngredient(body, req.user!);
    sendSuccessResponse(res, {
      statusCode: 201,
      message: 'Ingredient created successfully.',
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

export async function listIngredients(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await inventoryService.listIngredients(req.user!, req.query.category as string);
    sendSuccessResponse(res, { message: 'Ingredients retrieved.', data: result });
  } catch (err) {
    next(err);
  }
}

export async function initInventory(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = initInventorySchema.parse(req.body);
    const result = await inventoryService.initInventory(body, req.user!);
    sendSuccessResponse(res, {
      statusCode: 201,
      message: 'Inventory record initialized.',
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

export async function recordStockMutation(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = stockMutationSchema.parse(req.body);
    const type = (req.params.actionType || 'adjustment_in') as any;
    const result = await inventoryService.recordStockMutation(body, type, req.user!);
    sendSuccessResponse(res, {
      statusCode: 201,
      message: 'Stock updated successfully.',
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

export async function listInventory(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await inventoryService.listInventoryBalances(
      req.user!,
      req.query.branchId as string,
    );
    sendSuccessResponse(res, { message: 'Inventory balances retrieved.', data: result });
  } catch (err) {
    next(err);
  }
}

export async function listLowStock(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await inventoryService.listLowStockItems(
      req.user!,
      req.query.branchId as string,
    );
    sendSuccessResponse(res, { message: 'Low stock items retrieved.', data: result });
  } catch (err) {
    next(err);
  }
}

export async function listTransactions(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await inventoryService.listStockTransactions(
      req.user!,
      req.query.branchId as string,
      req.query.ingredientId as string,
    );
    sendSuccessResponse(res, { message: 'Stock transactions retrieved.', data: result });
  } catch (err) {
    next(err);
  }
}

export async function createSupplier(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = createSupplierSchema.parse(req.body);
    const result = await inventoryService.createSupplier(body, req.user!);
    sendSuccessResponse(res, { statusCode: 201, message: 'Supplier created.', data: result });
  } catch (err) {
    next(err);
  }
}

export async function listSuppliers(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await inventoryService.listSuppliers(req.user!);
    sendSuccessResponse(res, { message: 'Suppliers retrieved.', data: result });
  } catch (err) {
    next(err);
  }
}

export async function createPurchaseOrder(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = createPurchaseOrderSchema.parse(req.body);
    const result = await poService.createPurchaseOrder(body, req.user!);
    sendSuccessResponse(res, { statusCode: 201, message: 'Purchase Order created.', data: result });
  } catch (err) {
    next(err);
  }
}

export async function approvePurchaseOrder(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await poService.approvePurchaseOrder(req.params.poId as string, req.user!);
    sendSuccessResponse(res, { message: 'Purchase Order approved.', data: result });
  } catch (err) {
    next(err);
  }
}

export async function receivePurchaseOrder(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = receivePurchaseOrderSchema.parse(req.body);
    const result = await poService.receivePurchaseOrder(req.params.poId as string, body, req.user!);
    sendSuccessResponse(res, { message: 'Purchase Order lines received.', data: result });
  } catch (err) {
    next(err);
  }
}

export async function listPurchaseOrders(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await poService.listPurchaseOrders(req.user!, req.query.branchId as string);
    sendSuccessResponse(res, { message: 'Purchase Orders listed.', data: result });
  } catch (err) {
    next(err);
  }
}
