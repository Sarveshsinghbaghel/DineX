import assert from 'node:assert/strict';
import { test, describe, before, after } from 'node:test';
import mongoose from 'mongoose';

import { Restaurant } from '../features/restaurants/models/restaurant.model';
import { Branch } from '../features/branches/models/branch.model';
import { Table } from '../features/tables/models/table.model';
import { Order } from '../features/orders/models/order.model';

import * as qrTokenService from '../features/qr-ordering/services/qr-token.service';
import * as qrMenuService from '../features/qr-ordering/services/qr-menu.service';
import * as qrCheckoutService from '../features/qr-ordering/services/qr-checkout.service';
import * as qrStatusService from '../features/qr-ordering/services/qr-status.service';

import { tableCreateSchema, qrCheckoutSchema } from '@x10think/validation';

import type { UserAuthContext } from '../middlewares/authorization.middleware';

describe('DineX Phase 20: QR Ordering System Integration Test Suite', () => {
  const tenantId = 'tenant_test_qr_20';
  const restaurantId = new mongoose.Types.ObjectId();
  const branchId = new mongoose.Types.ObjectId();

  const mockAdminActor: UserAuthContext = {
    userId: new mongoose.Types.ObjectId().toString(),
    sessionId: 'sess_admin_qr',
    tenantId,
    roles: [{ _id: 'r1', name: 'Admin', code: 'admin', isSystem: true }],
    permissions: ['tables.read', 'tables.manage', 'orders.read'],
  };

  const mockManagerActor: UserAuthContext = {
    userId: new mongoose.Types.ObjectId().toString(),
    sessionId: 'sess_mgr_qr',
    tenantId,
    branchIds: [branchId.toString()],
    roles: [{ _id: 'r2', name: 'Manager', code: 'manager', isSystem: true }],
    permissions: ['tables.read', 'tables.manage'],
  };

  let createdTableId: string;
  let activeQRToken: string;

  before(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dinex-test');
    }

    await Restaurant.deleteMany({ tenantId });
    await Branch.deleteMany({ tenantId });
    await Table.deleteMany({ tenantId });
    await Order.deleteMany({ tenantId });

    await Restaurant.create({
      _id: restaurantId,
      tenantId,
      name: 'DineX Fine Dining',
      legalName: 'DineX Hospitality Pvt Ltd',
      email: 'info@dinex.app',
      phone: '+919876543210',
      address: {
        label: 'Main',
        recipientName: 'Manager',
        phone: '+919876543210',
        addressLine1: 'Connaught Place',
        city: 'New Delhi',
        state: 'Delhi',
        postalCode: '110001',
        country: 'India',
      },
      cuisineTypes: ['North Indian'],
      status: 'ACTIVE',
      currency: 'INR',
      timezone: 'Asia/Kolkata',
    });

    await Branch.create({
      _id: branchId,
      tenantId,
      restaurantId,
      name: 'Connaught Place Flagship',
      code: 'QR-CP-01',
      email: 'cp@dinex.app',
      phone: '+919876543210',
      address: {
        label: 'Main',
        recipientName: 'Manager',
        phone: '+919876543210',
        addressLine1: 'Connaught Place',
        city: 'New Delhi',
        state: 'Delhi',
        postalCode: '110001',
        country: 'India',
      },
      timezone: 'Asia/Kolkata',
      status: 'ACTIVE',
    });
  });

  after(async () => {
    await Restaurant.deleteMany({ tenantId });
    await Branch.deleteMany({ tenantId });
    await Table.deleteMany({ tenantId });
    await Order.deleteMany({ tenantId });

    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });

  test('1. Table creation, secure QR token generation, and validation', async () => {
    const input = tableCreateSchema.parse({
      branchId: branchId.toString(),
      tableNumber: 'T-01',
      capacity: 4,
      section: 'Main Dining',
    });

    const table = await qrTokenService.createTable(input, mockAdminActor);

    assert.ok(table);
    assert.equal(table.tableNumber, 'T-01');
    assert.ok(table.qrToken.startsWith('qr_tok_'));
    assert.equal(table.qrStatus, 'active');

    createdTableId = table.id;
    activeQRToken = table.qrToken;

    const validatedContext = await qrTokenService.validateQRToken(activeQRToken);
    assert.equal(validatedContext.isValid, true);
    assert.equal(validatedContext.restaurantName, 'DineX Fine Dining');
    assert.equal(validatedContext.tableNumber, 'T-01');
  });

  test('2. Token regeneration & status toggle (activate/deactivate)', async () => {
    const regenerated = await qrTokenService.generateOrRegenerateQRToken(
      createdTableId,
      mockManagerActor,
    );

    assert.ok(regenerated.qrToken.startsWith('qr_tok_'));
    assert.notEqual(regenerated.qrToken, activeQRToken);
    activeQRToken = regenerated.qrToken;

    await qrTokenService.setTableQRStatus(createdTableId, 'inactive', mockManagerActor);

    await assert.rejects(async () => qrTokenService.validateQRToken(activeQRToken), {
      name: 'AppError',
      message: 'QR Code is invalid, expired, or deactivated.',
    });

    // Reactivate for subsequent checkout tests
    await qrTokenService.setTableQRStatus(createdTableId, 'active', mockManagerActor);
  });

  test('3. Public mobile QR menu fetching with AI recommendations', async () => {
    const menuData = await qrMenuService.getPublicQRMenu(activeQRToken);

    assert.ok(menuData.context);
    assert.equal(menuData.context.tableNumber, 'T-01');
    assert.ok(menuData.categories.length > 0);
    assert.ok(menuData.menuItems.length > 0);
    assert.ok(menuData.recommendations.length > 0);
  });

  test('4. Server-authoritative QR Checkout (Price & Tax Recalculation)', async () => {
    // Client attempts checkout with 2 items
    const checkoutInput = qrCheckoutSchema.parse({
      token: activeQRToken,
      guestName: 'Ananya Sharma',
      items: [
        { menuItemId: 'ITEM-101', quantity: 1, specialInstructions: 'Extra spicy' }, // Butter Chicken ₹420
        { menuItemId: 'ITEM-103', quantity: 2 }, // Garlic Naan 2 * ₹120 = ₹240
      ],
    });

    const result = await qrCheckoutService.checkoutQROrder(checkoutInput);

    assert.ok(result.orderId);
    assert.ok(result.orderNumber.startsWith('ORD-'));
    assert.equal(result.tableNumber, 'T-01');

    // Expected Subtotal: 420 + 240 = 660
    assert.equal(result.subtotal, 660);
    // Expected GST (5%): 33
    assert.equal(result.taxAmount, 33);
    // Expected Grand Total: 693
    assert.equal(result.grandTotal, 693);
    assert.equal(result.status, 'placed');

    // Verify Table status updated to 'occupied'
    const updatedTable = await Table.findById(createdTableId);
    assert.equal(updatedTable?.status, 'occupied');

    // Verify Order persisted in database
    const savedOrder = await Order.findById(result.orderId);
    assert.ok(savedOrder);
    assert.equal(savedOrder?.source, 'qr');
  });

  test('5. Live QR Order status tracking query', async () => {
    const placedOrder = await Order.findOne({ tenantId });
    assert.ok(placedOrder);

    const liveStatus = await qrStatusService.getQROrderStatus(placedOrder.id);

    assert.equal(liveStatus.orderNumber, placedOrder.orderNumber);
    assert.equal(liveStatus.tableNumber, 'T-01');
    assert.equal(liveStatus.status, 'placed');
    assert.ok(liveStatus.timeline.length >= 4);
    assert.equal(liveStatus.timeline[0].isCompleted, true);
  });

  test('6. Security: Manager branch boundary enforcement', async () => {
    const otherBranchManager: UserAuthContext = {
      userId: new mongoose.Types.ObjectId().toString(),
      sessionId: 'sess_other_branch',
      tenantId,
      branchIds: [new mongoose.Types.ObjectId().toString()], // different branch
      roles: [{ _id: 'r2', name: 'Manager', code: 'manager', isSystem: true }],
      permissions: ['tables.manage'],
    };

    await assert.rejects(
      async () =>
        qrTokenService.generateOrRegenerateQRToken(createdTableId, otherBranchManager),
      {
        name: 'AppError',
        message: 'Access denied: branch scope violation.',
      },
    );
  });

  test('7. Validation: Reject invalid or non-existent menu items on checkout', async () => {
    const invalidInput = qrCheckoutSchema.parse({
      token: activeQRToken,
      guestName: 'Fraud Tester',
      items: [{ menuItemId: 'INVALID-ITEM-999', quantity: 1 }],
    });

    await assert.rejects(async () => qrCheckoutService.checkoutQROrder(invalidInput), {
      name: 'AppError',
      message: "Item 'INVALID-ITEM-999' is invalid or no longer offered.",
    });
  });
});

