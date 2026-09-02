import mongoose from 'mongoose';
import { AppError } from '../../../errors/AppError';
import { PurchaseOrder } from '../models/purchase-order.model';
import { Supplier } from '../models/supplier.model';
import { recordStockMutation } from './inventory.service';
import { logAuditEvent } from '../../audit-logs/services/audit-log.service';
import type { CreatePurchaseOrderInput, ReceivePurchaseOrderInput } from '@x10think/validation';
import type { UserAuthContext } from '../../../middlewares/authorization.middleware';

export async function createPurchaseOrder(input: CreatePurchaseOrderInput, actor: UserAuthContext) {
  const tenantId = actor.tenantId || 'tenant_default';
  if (
    !mongoose.Types.ObjectId.isValid(input.branchId) ||
    !mongoose.Types.ObjectId.isValid(input.supplierId)
  ) {
    throw new AppError('Invalid branch or supplier ID format.', 400, 'INVALID_ID');
  }

  const supplier = await Supplier.findById(input.supplierId);
  if (!supplier || supplier.status === 'blocked') {
    throw new AppError('Supplier not found or blocked.', 409, 'SUPPLIER_INACTIVE');
  }

  const randomSeq = Math.floor(1000 + Math.random() * 9000);
  const poNumber = `PO-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${randomSeq}`;

  let grandTotal = 0;
  const items = input.items.map((item) => {
    const lineTotal = item.orderedQuantity * item.unitCost * (1 + (item.taxRate || 0) / 100);
    grandTotal += lineTotal;
    return {
      ingredientId: new mongoose.Types.ObjectId(item.ingredientId),
      orderedQuantity: item.orderedQuantity,
      receivedQuantity: 0,
      unit: item.unit,
      unitCost: item.unitCost,
      taxRate: item.taxRate,
      lineTotal,
    };
  });

  const po = await PurchaseOrder.create({
    tenantId,
    branchId: new mongoose.Types.ObjectId(input.branchId),
    supplierId: supplier._id,
    poNumber,
    status: 'draft',
    items,
    orderedAt: new Date(),
    expectedDeliveryAt: input.expectedDeliveryAt ? new Date(input.expectedDeliveryAt) : undefined,
    notes: input.notes,
    grandTotal,
  });

  await logAuditEvent({
    tenantId,
    actorId: actor.userId,
    action: 'PURCHASE_ORDER_CREATED',
    targetType: 'purchase_order',
    targetId: po.id,
    metadata: { poNumber, grandTotal },
  });

  return po;
}

export async function approvePurchaseOrder(poId: string, actor: UserAuthContext) {
  if (!mongoose.Types.ObjectId.isValid(poId))
    throw new AppError('Invalid PO ID format.', 400, 'INVALID_ID');

  const po = await PurchaseOrder.findById(poId);
  if (!po) throw new AppError('Purchase order not found.', 404, 'PO_NOT_FOUND');

  if (po.status !== 'draft' && po.status !== 'pending_approval') {
    throw new AppError(
      `Cannot approve PO with status '${po.status}'.`,
      409,
      'INVALID_PO_TRANSITION',
    );
  }

  po.status = 'approved';
  po.approvedBy = new mongoose.Types.ObjectId(actor.userId);
  po.approvedAt = new Date();
  await po.save();

  await logAuditEvent({
    tenantId: po.tenantId,
    actorId: actor.userId,
    action: 'PURCHASE_ORDER_APPROVED',
    targetType: 'purchase_order',
    targetId: po.id,
  });

  return po;
}

export async function receivePurchaseOrder(
  poId: string,
  input: ReceivePurchaseOrderInput,
  actor: UserAuthContext,
) {
  if (!mongoose.Types.ObjectId.isValid(poId))
    throw new AppError('Invalid PO ID format.', 400, 'INVALID_ID');

  const po = await PurchaseOrder.findById(poId);
  if (!po) throw new AppError('Purchase order not found.', 404, 'PO_NOT_FOUND');

  if (po.status !== 'approved' && po.status !== 'sent' && po.status !== 'partially_received') {
    throw new AppError(
      `Cannot receive PO with status '${po.status}'.`,
      409,
      'INVALID_PO_TRANSITION',
    );
  }

  for (const rItem of input.items) {
    const poLine = po.items.find((i) => i.ingredientId.toString() === rItem.ingredientId);
    if (!poLine) continue;

    if (poLine.receivedQuantity + rItem.receivedQuantity > poLine.orderedQuantity) {
      throw new AppError(
        'Received quantity exceeds ordered quantity.',
        409,
        'RECEIPT_EXCEEDS_ORDERED',
      );
    }

    poLine.receivedQuantity += rItem.receivedQuantity;

    // Mutate stock in inventory atomically
    if (rItem.receivedQuantity > 0) {
      await recordStockMutation(
        {
          ingredientId: rItem.ingredientId,
          branchId: po.branchId.toString(),
          quantity: rItem.receivedQuantity,
          unitCost: poLine.unitCost,
          sourceType: 'purchase_order',
          sourceId: po.id,
          reason: `PO Receipt ${po.poNumber}`,
        },
        'purchase_receipt',
        actor,
      );
    }
  }

  const allReceived = po.items.every((i) => i.receivedQuantity >= i.orderedQuantity);
  po.status = allReceived ? 'received' : 'partially_received';
  po.receivedAt = new Date();
  await po.save();

  await logAuditEvent({
    tenantId: po.tenantId,
    actorId: actor.userId,
    action: 'PURCHASE_ORDER_RECEIVED',
    targetType: 'purchase_order',
    targetId: po.id,
    metadata: { status: po.status },
  });

  return po;
}

export async function listPurchaseOrders(actor: UserAuthContext, branchId?: string) {
  const filter: Record<string, unknown> = {};
  const isSuperAdmin = actor.roles.some((r) => r.code === 'super_admin');
  if (!isSuperAdmin && actor.tenantId) filter.tenantId = actor.tenantId;
  if (branchId && mongoose.Types.ObjectId.isValid(branchId)) {
    filter.branchId = new mongoose.Types.ObjectId(branchId);
  }

  return PurchaseOrder.find(filter).populate('supplierId').sort({ orderedAt: -1 });
}
