import assert from 'node:assert/strict';
import { test, describe, before, after } from 'node:test';
import mongoose from 'mongoose';

import { Ingredient } from '../features/inventory/models/ingredient.model';
import { Inventory } from '../features/inventory/models/inventory.model';
import { StockTransaction } from '../features/inventory/models/stock-transaction.model';
import { Supplier } from '../features/inventory/models/supplier.model';
import { PurchaseOrder } from '../features/inventory/models/purchase-order.model';
import { Employee } from '../features/employees/models/employee.model';
import { Shift } from '../features/employees/models/shift.model';
import { Attendance } from '../features/employees/models/attendance.model';
import { Notification } from '../features/notifications/models/notification.model';
import { Review } from '../features/engagement/models/review.model';
import { Rating } from '../features/engagement/models/rating.model';
import { Coupon, CouponUsage } from '../features/engagement/models/coupon.model';
import { LoyaltyTransaction } from '../features/engagement/models/loyalty.model';
import { Favorite } from '../features/engagement/models/favorite.model';
import { User } from '../features/auth/models/auth.models';

import * as inventoryService from '../features/inventory/services/inventory.service';
import * as poService from '../features/inventory/services/purchase-order.service';
import * as employeeService from '../features/employees/services/employee.service';
import * as notificationService from '../features/notifications/services/notification.service';
import * as engagementService from '../features/engagement/services/engagement.service';

import {
  stockMutationSchema,
  createSupplierSchema,
  createPurchaseOrderSchema,
  createEmployeeSchema,
  createShiftSchema,
  createCouponSchema,
} from '@x10think/validation';

import type { UserAuthContext } from '../middlewares/authorization.middleware';

describe('DineX Combined Phases 13–16 Test Suite', () => {
  const tenantId = 'tenant_test_13_16';
  const branchId = new mongoose.Types.ObjectId().toString();
  const userId = new mongoose.Types.ObjectId().toString();
  const customerId = new mongoose.Types.ObjectId().toString();
  const empUserId = new mongoose.Types.ObjectId().toString();
  let sharedEmployeeId: string;

  const mockAdminActor: UserAuthContext = {
    userId,
    sessionId: 'sess_admin',
    tenantId,
    roles: [{ _id: 'r1', name: 'Admin', code: 'admin', isSystem: true }],
    permissions: [
      'inventory.view',
      'inventory.manage',
      'inventory.adjust',
      'procurement.manage',
      'employees.view',
      'employees.manage',
      'shifts.manage',
      'attendance.manage',
      'notifications.broadcast',
      'reviews.moderate',
      'coupons.manage',
    ],
  };

  const mockCustomerActor: UserAuthContext = {
    userId: customerId,
    sessionId: 'sess_customer',
    tenantId,
    roles: [{ _id: 'r2', name: 'Customer', code: 'customer', isSystem: true }],
    permissions: [],
  };

  before(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dinex-test');
    }

    await User.deleteMany({ tenantId });
    await Ingredient.deleteMany({ tenantId });
    await Inventory.deleteMany({ tenantId });
    await StockTransaction.deleteMany({ tenantId });
    await Supplier.deleteMany({ tenantId });
    await PurchaseOrder.deleteMany({ tenantId });
    await Employee.deleteMany({ tenantId });
    await Shift.deleteMany({ tenantId });
    await Attendance.deleteMany({ tenantId });
    await Notification.deleteMany({ tenantId });
    await Review.deleteMany({ tenantId });
    await Rating.deleteMany({ tenantId });
    await Coupon.deleteMany({ tenantId });
    await CouponUsage.deleteMany({ tenantId });
    await LoyaltyTransaction.deleteMany({ tenantId });
    await Favorite.deleteMany({ tenantId });

    // Seed mock users
    await User.create({
      _id: new mongoose.Types.ObjectId(userId),
      tenantId,
      name: 'Admin User',
      email: `admin_${Date.now()}@dinex.test`,
      passwordHash: 'hash',
      emailVerified: true,
      accountStatus: 'active',
      roleIds: [new mongoose.Types.ObjectId()],
    });

    await User.create({
      _id: new mongoose.Types.ObjectId(customerId),
      tenantId,
      name: 'Customer User',
      email: `customer_${Date.now()}@dinex.test`,
      passwordHash: 'hash',
      emailVerified: true,
      accountStatus: 'active',
      roleIds: [new mongoose.Types.ObjectId()],
    });

    await User.create({
      _id: new mongoose.Types.ObjectId(empUserId),
      tenantId,
      name: 'Employee User',
      email: `emp_${Date.now()}@dinex.test`,
      passwordHash: 'hash',
      emailVerified: true,
      accountStatus: 'active',
      roleIds: [new mongoose.Types.ObjectId()],
    });
  });

  after(async () => {
    await User.deleteMany({ tenantId });
    await Ingredient.deleteMany({ tenantId });
    await Inventory.deleteMany({ tenantId });
    await StockTransaction.deleteMany({ tenantId });
    await Supplier.deleteMany({ tenantId });
    await PurchaseOrder.deleteMany({ tenantId });
    await Employee.deleteMany({ tenantId });
    await Shift.deleteMany({ tenantId });
    await Attendance.deleteMany({ tenantId });
    await Notification.deleteMany({ tenantId });
    await Review.deleteMany({ tenantId });
    await Rating.deleteMany({ tenantId });
    await Coupon.deleteMany({ tenantId });
    await CouponUsage.deleteMany({ tenantId });
    await LoyaltyTransaction.deleteMany({ tenantId });
    await Favorite.deleteMany({ tenantId });

    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });

  // PHASE 13 — INVENTORY TESTS
  describe('Phase 13: Inventory & Procurement', () => {
    let ingredientId: string;
    let supplierId: string;
    let poId: string;

    test('1. Create ingredient and initialize branch stock balance', async () => {
      const ing = await inventoryService.createIngredient(
        {
          name: 'Basmati Rice Premium',
          sku: 'ING-RICE-01',
          baseUnit: 'kg',
          category: 'Grains',
          reorderUnit: 'kg',
          yieldFactor: 1.0,
          status: 'active',
        },
        mockAdminActor,
      );
      assert.ok(ing.id);
      ingredientId = ing.id;

      const inv = await inventoryService.initInventory(
        {
          branchId,
          ingredientId,
          currentQuantity: 50,
          reorderLevel: 20,
          unit: 'kg',
        },
        mockAdminActor,
      );
      assert.equal(inv.currentQuantity, 50);
    });

    test('2. Stock mutation and negative stock prevention', async () => {
      // Stock Out
      const mutateOutInput = stockMutationSchema.parse({
        ingredientId,
        branchId,
        quantity: 35,
        reason: 'Kitchen prep',
      });

      const resOut = await inventoryService.recordStockMutation(
        mutateOutInput,
        'stock_out',
        mockAdminActor,
      );
      assert.equal(resOut.inventory.currentQuantity, 15);

      // Negative stock rejection
      const overDeductInput = stockMutationSchema.parse({
        ingredientId,
        branchId,
        quantity: 50,
        reason: 'Over-deduction test',
      });

      await assert.rejects(
        async () =>
          inventoryService.recordStockMutation(overDeductInput, 'stock_out', mockAdminActor),
        {
          name: 'AppError',
          message: 'Insufficient stock. Current: 15, Attempted reduction: 50',
        },
      );
    });

    test('3. Supplier creation and PO receiving workflow', async () => {
      const supplierInput = createSupplierSchema.parse({
        name: 'Global Agro Foods',
        supplierCode: 'SUP-AGRO-01',
        status: 'active',
        contacts: [{ name: 'Agro Admin', phone: '+919988776655', isPrimary: true }],
      });

      const supplier = await inventoryService.createSupplier(supplierInput, mockAdminActor);
      assert.ok(supplier.id);
      supplierId = supplier.id;

      const poInput = createPurchaseOrderSchema.parse({
        branchId,
        supplierId,
        items: [{ ingredientId, orderedQuantity: 100, unit: 'kg', unitCost: 80 }],
      });

      const po = await poService.createPurchaseOrder(poInput, mockAdminActor);
      assert.equal(po.status, 'draft');
      poId = po.id;

      const approvedPo = await poService.approvePurchaseOrder(poId, mockAdminActor);
      assert.equal(approvedPo.status, 'approved');

      // Receive PO line item
      const receivedPo = await poService.receivePurchaseOrder(
        poId,
        { items: [{ ingredientId, receivedQuantity: 100 }] },
        mockAdminActor,
      );
      assert.equal(receivedPo.status, 'received');

      // Balance should be updated by 100 kg (15 + 100 = 115)
      const balances = await inventoryService.listInventoryBalances(mockAdminActor, branchId);
      const updatedInv = balances.find(
        (b) =>
          b.ingredientId.toString() === ingredientId ||
          (typeof b.ingredientId === 'object' &&
            (b.ingredientId as any)._id?.toString() === ingredientId),
      );
      assert.equal(updatedInv?.currentQuantity, 115);
    });
  });

  // PHASE 14 — EMPLOYEE MANAGEMENT TESTS
  describe('Phase 14: Employee Management', () => {
    test('1. Create Employee profile linked to User identity', async () => {
      const empInput = createEmployeeSchema.parse({
        userId: empUserId,
        employeeNumber: 'EMP-1001',
        employmentStatus: 'active',
        employmentType: 'full_time',
        primaryBranchId: branchId,
        branchIds: [branchId],
        jobTitle: 'Head Chef',
        department: 'Kitchen',
      });

      const emp = await employeeService.createEmployee(empInput, mockAdminActor);

      assert.ok(emp.id);
      sharedEmployeeId = emp.id;
      assert.equal(emp.employeeNumber, 'EMP-1001');
    });

    test('2. Shift scheduling and overlap prevention', async () => {
      const shift1Input = createShiftSchema.parse({
        branchId,
        employeeId: sharedEmployeeId,
        date: '2026-09-10',
        startTime: '09:00',
        endTime: '17:00',
      });

      const shift1 = await employeeService.createShift(shift1Input, mockAdminActor);
      assert.ok(shift1.id);

      // Overlapping shift rejection
      const overlapInput = createShiftSchema.parse({
        branchId,
        employeeId: sharedEmployeeId,
        date: '2026-09-10',
        startTime: '14:00',
        endTime: '22:00',
      });

      await assert.rejects(async () => employeeService.createShift(overlapInput, mockAdminActor), {
        name: 'AppError',
        message: 'Shift schedule overlaps with an existing shift for this employee.',
      });
    });

    test('3. Attendance clock-in and clock-out', async () => {
      const clockInRes = await employeeService.clockIn(
        {
          employeeId: sharedEmployeeId,
          branchId,
          notes: 'Arrived on time',
        },
        mockAdminActor,
      );
      assert.ok(clockInRes.clockInAt);

      const clockOutRes = await employeeService.clockOut(
        {
          employeeId: sharedEmployeeId,
          branchId,
          notes: 'Shift completed',
        },
        mockAdminActor,
      );
      assert.equal(clockOutRes.status, 'completed');
    });
  });

  // PHASE 15 — NOTIFICATIONS TESTS
  describe('Phase 15: Centralized Notification Service', () => {
    let notificationId: string;

    test('1. Send notification, count unread, and mark read', async () => {
      const notif = await notificationService.sendNotification({
        tenantId,
        recipientUserId: userId,
        type: 'INVENTORY',
        title: 'Low Stock Alert',
        body: 'Basmati Rice is below reorder level.',
        priority: 'high',
      });
      assert.ok(notif);
      notificationId = notif.id;

      const count = await notificationService.getUnreadCount(userId);
      assert.ok(count > 0);

      const readNotif = await notificationService.markAsRead(notificationId, userId);
      assert.equal(readNotif.status, 'read');
    });
  });

  // PHASE 16 — CUSTOMER ENGAGEMENT TESTS
  describe('Phase 16: Customer Engagement', () => {
    const orderId = new mongoose.Types.ObjectId().toString();

    test('1. Review submission & moderation', async () => {
      const review = await engagementService.createReview(
        {
          branchId,
          orderId,
          title: 'Great Dining Experience',
          content: 'The food and ambience were absolutely top-notch!',
          rating: 5,
        },
        mockCustomerActor,
      );
      assert.equal(review.status, 'pending');

      const moderated = await engagementService.moderateReview(
        review.id,
        { status: 'published' },
        mockAdminActor,
      );
      assert.equal(moderated.status, 'published');
    });

    test('2. Coupon validation & discount calculation without negative totals', async () => {
      const couponInput = createCouponSchema.parse({
        code: 'TEST20',
        discountType: 'percentage',
        value: 20,
        startsAt: new Date(Date.now() - 86400000).toISOString(),
        endsAt: new Date(Date.now() + 86400000).toISOString(),
        minimumOrderAmount: 200,
        maximumDiscountAmount: 100,
        status: 'active',
      });

      const coupon = await engagementService.createCoupon(couponInput, mockAdminActor);
      assert.equal(coupon.code, 'TEST20');

      const valid = await engagementService.validateCoupon(
        { code: 'TEST20', branchId, orderAmount: 600 },
        mockCustomerActor,
      );
      assert.equal(valid.valid, true);
      assert.equal(valid.discountAmount, 100); // Capped at max discount 100
      assert.equal(valid.finalAmount, 500);
    });

    test('3. Loyalty points grant & transaction ledger', async () => {
      const res = await engagementService.grantLoyaltyPoints(
        customerId,
        150,
        'order_reward',
        orderId,
        'Points earned on order',
        mockAdminActor,
      );
      assert.equal(res.balance, 150);

      const balanceInfo = await engagementService.getLoyaltyBalance(customerId, mockCustomerActor);
      assert.equal(balanceInfo.points, 150);
      assert.equal(balanceInfo.transactions.length, 1);
    });

    test('4. Customer favorites CRUD', async () => {
      const fav = await engagementService.addFavorite(
        { menuItemId: 'ITEM-101', branchId },
        mockCustomerActor,
      );
      assert.ok(fav.id);

      const list = await engagementService.listFavorites(mockCustomerActor);
      assert.equal(list.length, 1);

      await engagementService.removeFavorite('ITEM-101', mockCustomerActor);
      const remaining = await engagementService.listFavorites(mockCustomerActor);
      assert.equal(remaining.length, 0);
    });
  });
});
