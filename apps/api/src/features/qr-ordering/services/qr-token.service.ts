import crypto from 'node:crypto';
import mongoose from 'mongoose';
import { AppError } from '../../../errors/AppError';
import { Table } from '../../tables/models/table.model';
import { Branch } from '../../branches/models/branch.model';
import { Restaurant } from '../../restaurants/models/restaurant.model';
import type { TableCreateInput } from '@x10think/validation';

import type { UserAuthContext } from '../../../middlewares/authorization.middleware';
import type { PublicQRContext } from '@x10think/types';

function checkBranchScope(actor: UserAuthContext, branchId: string) {
  const isSuperAdmin = actor.roles.some((r) => r.code === 'super_admin');
  if (isSuperAdmin) return;

  const isAdmin = actor.roles.some((r) => r.code === 'admin');
  const isManager = actor.roles.some((r) => r.code === 'manager');

  if (isManager && !isAdmin && actor.branchIds && actor.branchIds.length > 0) {
    if (!actor.branchIds.includes(branchId)) {
      throw new AppError('Access denied: branch scope violation.', 403, 'BRANCH_SCOPE_DENIED');
    }
  }
}

function generateSecureToken(): string {
  return `qr_tok_${crypto.randomBytes(16).toString('hex')}`;
}

export async function createTable(input: TableCreateInput, actor: UserAuthContext) {
  checkBranchScope(actor, input.branchId);

  const tenantId = actor.tenantId || 'tenant_default';
  const branch = await Branch.findById(input.branchId);
  if (!branch || branch.status === 'INACTIVE') {
    throw new AppError('Invalid or inactive branch.', 400, 'INVALID_BRANCH');
  }

  const existing = await Table.findOne({
    tenantId,
    branchId: new mongoose.Types.ObjectId(input.branchId),
    tableNumber: input.tableNumber.trim(),
  });
  if (existing) {
    throw new AppError('Table number already exists in this branch.', 409, 'TABLE_EXISTS');
  }

  const qrToken = generateSecureToken();
  const table = await Table.create({
    tenantId,
    branchId: new mongoose.Types.ObjectId(input.branchId),
    tableNumber: input.tableNumber.trim(),
    capacity: input.capacity,
    section: input.section,
    status: 'available',
    qrToken,
    qrStatus: 'active',
  });

  return table;
}

export async function listTablesByBranch(branchId: string, actor: UserAuthContext) {
  checkBranchScope(actor, branchId);
  const tenantId = actor.tenantId || 'tenant_default';

  return Table.find({
    tenantId,
    branchId: new mongoose.Types.ObjectId(branchId),
  }).sort({ section: 1, tableNumber: 1 });
}

export async function generateOrRegenerateQRToken(tableId: string, actor: UserAuthContext) {
  if (!mongoose.Types.ObjectId.isValid(tableId)) {
    throw new AppError('Invalid table ID.', 400, 'INVALID_ID');
  }

  const table = await Table.findById(tableId);
  if (!table) {
    throw new AppError('Table not found.', 404, 'TABLE_NOT_FOUND');
  }

  checkBranchScope(actor, table.branchId.toString());

  table.qrToken = generateSecureToken();
  table.qrStatus = 'active';
  await table.save();

  return table;
}

export async function setTableQRStatus(
  tableId: string,
  qrStatus: 'active' | 'inactive',
  actor: UserAuthContext,
) {
  if (!mongoose.Types.ObjectId.isValid(tableId)) {
    throw new AppError('Invalid table ID.', 400, 'INVALID_ID');
  }

  const table = await Table.findById(tableId);
  if (!table) {
    throw new AppError('Table not found.', 404, 'TABLE_NOT_FOUND');
  }

  checkBranchScope(actor, table.branchId.toString());

  table.qrStatus = qrStatus;
  await table.save();

  return table;
}

export async function validateQRToken(token: string): Promise<PublicQRContext> {
  const table = await Table.findOne({ qrToken: token });
  if (!table || table.qrStatus !== 'active') {
    throw new AppError('QR Code is invalid, expired, or deactivated.', 400, 'QR_INVALID');
  }

  const branch = await Branch.findById(table.branchId);
  if (!branch || branch.status !== 'ACTIVE') {
    throw new AppError('Restaurant branch is currently inactive.', 400, 'BRANCH_INACTIVE');
  }

  const restaurant = await Restaurant.findById(branch.restaurantId);
  if (!restaurant || restaurant.status !== 'ACTIVE') {
    throw new AppError('Restaurant entity is currently inactive.', 400, 'RESTAURANT_INACTIVE');
  }

  return {
    token,
    isValid: true,
    restaurantName: restaurant.name,
    branchName: branch.name,
    branchCode: branch.code,
    tableNumber: table.tableNumber,
    section: table.section,
    currency: restaurant.currency || 'INR',
  };
}
