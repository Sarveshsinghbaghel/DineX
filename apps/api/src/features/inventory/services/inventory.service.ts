import mongoose from 'mongoose';
import { AppError } from '../../../errors/AppError';
import { Ingredient } from '../models/ingredient.model';
import { Inventory, deriveStockState } from '../models/inventory.model';
import { StockTransaction } from '../models/stock-transaction.model';
import { Supplier } from '../models/supplier.model';
import { logAuditEvent } from '../../audit-logs/services/audit-log.service';
import type {
  CreateIngredientInput,
  StockMutationInput,
  InitInventoryInput,
  CreateSupplierInput,
} from '@x10think/validation';
import type { StockTransactionType } from '@x10think/types';
import type { UserAuthContext } from '../../../middlewares/authorization.middleware';

// INGREDIENTS
export async function createIngredient(input: CreateIngredientInput, actor: UserAuthContext) {
  const tenantId = actor.tenantId || 'tenant_default';

  const existing = await Ingredient.findOne({ tenantId, sku: input.sku });
  if (existing) {
    throw new AppError(
      `Ingredient with SKU '${input.sku}' already exists.`,
      409,
      'INGREDIENT_SKU_EXISTS',
    );
  }

  const ingredient = await Ingredient.create({
    tenantId,
    name: input.name,
    sku: input.sku,
    baseUnit: input.baseUnit,
    category: input.category,
    preferredSupplierId: input.preferredSupplierId
      ? new mongoose.Types.ObjectId(input.preferredSupplierId)
      : undefined,
    reorderUnit: input.reorderUnit,
    allergenInfo: input.allergenInfo,
    yieldFactor: input.yieldFactor,
    status: input.status,
  });

  await logAuditEvent({
    tenantId,
    actorId: actor.userId,
    action: 'INGREDIENT_CREATED',
    targetType: 'ingredient',
    targetId: ingredient.id,
    metadata: { name: ingredient.name, sku: ingredient.sku },
  });

  return ingredient;
}

export async function listIngredients(actor: UserAuthContext, category?: string) {
  const filter: Record<string, unknown> = {};
  const isSuperAdmin = actor.roles.some((r) => r.code === 'super_admin');
  if (!isSuperAdmin && actor.tenantId) filter.tenantId = actor.tenantId;
  if (category) filter.category = category;

  return Ingredient.find(filter).sort({ name: 1 });
}

// INVENTORY BALANCE & STOCK MUTATION
export async function initInventory(input: InitInventoryInput, actor: UserAuthContext) {
  const tenantId = actor.tenantId || 'tenant_default';
  if (
    !mongoose.Types.ObjectId.isValid(input.branchId) ||
    !mongoose.Types.ObjectId.isValid(input.ingredientId)
  ) {
    throw new AppError('Invalid branch or ingredient ID format.', 400, 'INVALID_ID');
  }

  const existing = await Inventory.findOne({
    tenantId,
    branchId: new mongoose.Types.ObjectId(input.branchId),
    ingredientId: new mongoose.Types.ObjectId(input.ingredientId),
  });

  if (existing) {
    throw new AppError(
      'Inventory record already exists for this branch & ingredient.',
      409,
      'INVENTORY_RECORD_EXISTS',
    );
  }

  const inventory = await Inventory.create({
    tenantId,
    branchId: new mongoose.Types.ObjectId(input.branchId),
    ingredientId: new mongoose.Types.ObjectId(input.ingredientId),
    currentQuantity: input.currentQuantity,
    reorderLevel: input.reorderLevel,
    minQuantity: input.minQuantity,
    maxQuantity: input.maxQuantity,
    unit: input.unit,
    storageLocation: input.storageLocation,
    status: input.currentQuantity > 0 ? 'active' : 'out_of_stock',
  });

  if (input.currentQuantity > 0) {
    await StockTransaction.create({
      tenantId,
      branchId: inventory.branchId,
      ingredientId: inventory.ingredientId,
      transactionType: 'adjustment_in',
      quantityDelta: input.currentQuantity,
      unit: input.unit,
      balanceAfter: input.currentQuantity,
      sourceType: 'initialization',
      sourceId: inventory.id,
      performedBy: new mongoose.Types.ObjectId(actor.userId),
    });
  }

  return inventory;
}

export async function recordStockMutation(
  input: StockMutationInput,
  mutationType: StockTransactionType,
  actor: UserAuthContext,
) {
  const tenantId = actor.tenantId || 'tenant_default';
  if (
    !mongoose.Types.ObjectId.isValid(input.branchId) ||
    !mongoose.Types.ObjectId.isValid(input.ingredientId)
  ) {
    throw new AppError('Invalid branch or ingredient ID format.', 400, 'INVALID_ID');
  }

  const inventory = await Inventory.findOne({
    tenantId,
    branchId: new mongoose.Types.ObjectId(input.branchId),
    ingredientId: new mongoose.Types.ObjectId(input.ingredientId),
  });

  if (!inventory) {
    throw new AppError('Inventory balance record not found.', 404, 'INVENTORY_NOT_FOUND');
  }

  let delta = input.quantity;
  if (
    mutationType === 'stock_out' ||
    mutationType === 'waste' ||
    mutationType === 'adjustment_out' ||
    mutationType === 'order_consumption' ||
    mutationType === 'return_to_supplier'
  ) {
    delta = -Math.abs(input.quantity);
  } else {
    delta = Math.abs(input.quantity);
  }

  const newQuantity = inventory.currentQuantity + delta;
  if (newQuantity < 0) {
    throw new AppError(
      `Insufficient stock. Current: ${inventory.currentQuantity}, Attempted reduction: ${Math.abs(delta)}`,
      409,
      'NEGATIVE_INVENTORY',
    );
  }

  inventory.currentQuantity = newQuantity;
  inventory.lastTransactionAt = new Date();
  inventory.status = newQuantity > 0 ? 'active' : 'out_of_stock';
  await inventory.save();

  const transaction = await StockTransaction.create({
    tenantId,
    branchId: inventory.branchId,
    ingredientId: inventory.ingredientId,
    transactionType: mutationType,
    quantityDelta: delta,
    unit: inventory.unit,
    unitCost: input.unitCost,
    occurredAt: new Date(),
    balanceAfter: newQuantity,
    sourceType: input.sourceType || 'manual_adjustment',
    sourceId: input.sourceId || new mongoose.Types.ObjectId().toString(),
    reason: input.reason,
    performedBy: new mongoose.Types.ObjectId(actor.userId),
  });

  await logAuditEvent({
    tenantId,
    actorId: actor.userId,
    action: 'STOCK_MUTATED',
    targetType: 'inventory',
    targetId: inventory.id,
    metadata: { mutationType, delta, balanceAfter: newQuantity },
  });

  return { inventory, transaction };
}

export async function deductStockForOrder(
  orderId: string,
  items: Array<{ ingredientId: string; branchId: string; quantity: number }>,
  actor: UserAuthContext,
) {
  const results = [];
  for (const item of items) {
    const res = await recordStockMutation(
      {
        ingredientId: item.ingredientId,
        branchId: item.branchId,
        quantity: item.quantity,
        sourceType: 'order_consumption',
        sourceId: orderId,
        reason: `Automated deduction for Order ${orderId}`,
      },
      'order_consumption',
      actor,
    );
    results.push(res);
  }
  return results;
}

export async function listInventoryBalances(actor: UserAuthContext, branchId?: string) {
  const filter: Record<string, unknown> = {};
  const isSuperAdmin = actor.roles.some((r) => r.code === 'super_admin');
  if (!isSuperAdmin && actor.tenantId) filter.tenantId = actor.tenantId;
  if (branchId && mongoose.Types.ObjectId.isValid(branchId)) {
    filter.branchId = new mongoose.Types.ObjectId(branchId);
  }

  const list = await Inventory.find(filter).populate('ingredientId').sort({ updatedAt: -1 });

  return list.map((inv) => {
    const obj = inv.toObject();
    const stockState = deriveStockState(inv.currentQuantity, inv.reorderLevel, inv.minQuantity);
    return { ...obj, stockState };
  });
}

export async function listLowStockItems(actor: UserAuthContext, branchId?: string) {
  const all = await listInventoryBalances(actor, branchId);
  return all.filter(
    (item) =>
      item.stockState === 'CRITICAL' ||
      item.stockState === 'LOW' ||
      item.stockState === 'OUT_OF_STOCK',
  );
}

export async function listStockTransactions(
  actor: UserAuthContext,
  branchId?: string,
  ingredientId?: string,
) {
  const filter: Record<string, unknown> = {};
  const isSuperAdmin = actor.roles.some((r) => r.code === 'super_admin');
  if (!isSuperAdmin && actor.tenantId) filter.tenantId = actor.tenantId;
  if (branchId && mongoose.Types.ObjectId.isValid(branchId)) {
    filter.branchId = new mongoose.Types.ObjectId(branchId);
  }
  if (ingredientId && mongoose.Types.ObjectId.isValid(ingredientId)) {
    filter.ingredientId = new mongoose.Types.ObjectId(ingredientId);
  }

  return StockTransaction.find(filter).sort({ occurredAt: -1 }).limit(100);
}

// SUPPLIERS
export async function createSupplier(input: CreateSupplierInput, actor: UserAuthContext) {
  const tenantId = actor.tenantId || 'tenant_default';

  const supplier = await Supplier.create({
    tenantId,
    name: input.name,
    supplierCode: input.supplierCode,
    status: input.status,
    contacts: input.contacts,
    taxRegistration: input.taxRegistration,
    paymentTermsDays: input.paymentTermsDays,
    ingredientIds: input.ingredientIds?.map((id) => new mongoose.Types.ObjectId(id)),
    notes: input.notes,
  });

  await logAuditEvent({
    tenantId,
    actorId: actor.userId,
    action: 'SUPPLIER_CREATED',
    targetType: 'supplier',
    targetId: supplier.id,
    metadata: { name: supplier.name },
  });

  return supplier;
}

export async function listSuppliers(actor: UserAuthContext) {
  const filter: Record<string, unknown> = {};
  const isSuperAdmin = actor.roles.some((r) => r.code === 'super_admin');
  if (!isSuperAdmin && actor.tenantId) filter.tenantId = actor.tenantId;

  return Supplier.find(filter).sort({ name: 1 });
}
