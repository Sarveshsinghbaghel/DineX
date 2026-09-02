import assert from 'node:assert/strict';
import { test, describe, before, after } from 'node:test';
import mongoose from 'mongoose';

import { Restaurant } from '../features/restaurants/models/restaurant.model';
import { Branch } from '../features/branches/models/branch.model';
import { Table } from '../features/tables/models/table.model';
import { Order } from '../features/orders/models/order.model';
import { User } from '../features/auth/models/auth.models';
import { Employee } from '../features/employees/models/employee.model';

import * as qrTokenService from '../features/qr-ordering/services/qr-token.service';
import * as qrMenuService from '../features/qr-ordering/services/qr-menu.service';
import * as qrCheckoutService from '../features/qr-ordering/services/qr-checkout.service';
import * as qrStatusService from '../features/qr-ordering/services/qr-status.service';

import * as addressService from '../features/delivery/services/delivery-address.service';
import * as fulfillmentService from '../features/delivery/services/delivery-fulfillment.service';
import * as socketService from '../lib/socket.service';

import { tableCreateSchema, qrCheckoutSchema, deliveryCheckoutSchema } from '@x10think/validation';
import type { UserAuthContext } from '../middlewares/authorization.middleware';

describe('DineX Phase 24: Comprehensive QA, E2E Journeys & Realtime Test Suite', () => {
  const tenantId = 'tenant_qa_24';
  const tenantIdOther = 'tenant_qa_24_other';
  const restaurantId = new mongoose.Types.ObjectId();
  const branchId = new mongoose.Types.ObjectId();
  const customerUserId = new mongoose.Types.ObjectId();
  const driverUserId = new mongoose.Types.ObjectId();
  const driverEmployeeId = new mongoose.Types.ObjectId();

  const mockCustomerActor: UserAuthContext = {
    userId: customerUserId.toString(),
    sessionId: 'sess_cust_qa_24',
    tenantId,
    roles: [{ _id: 'r_cust', name: 'Customer', code: 'customer', isSystem: true }],
    permissions: [],
  };

  const mockAdminActor: UserAuthContext = {
    userId: new mongoose.Types.ObjectId().toString(),
    sessionId: 'sess_admin_qa_24',
    tenantId,
    roles: [{ _id: 'r_admin', name: 'Admin', code: 'admin', isSystem: true }],
    permissions: ['tables.read', 'tables.manage', 'orders.read', 'delivery.view', 'delivery.manage'],
  };

  const mockDriverActor: UserAuthContext = {
    userId: driverUserId.toString(),
    sessionId: 'sess_driver_qa_24',
    tenantId,
    branchIds: [branchId.toString()],
    roles: [{ _id: 'r_driver', name: 'Employee', code: 'employee', isSystem: true }],
    permissions: ['delivery.fulfill'],
  };

  const mockOtherTenantActor: UserAuthContext = {
    userId: new mongoose.Types.ObjectId().toString(),
    sessionId: 'sess_other_qa_24',
    tenantId: tenantIdOther,
    branchIds: [],
    roles: [{ _id: 'r_admin_other', name: 'Admin', code: 'admin', isSystem: true }],
    permissions: ['orders.read', 'delivery.view'],
  };

  before(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dinex-test');
    }

    await Restaurant.deleteMany({ tenantId: { $in: [tenantId, tenantIdOther] } });
    await Branch.deleteMany({ tenantId: { $in: [tenantId, tenantIdOther] } });
    await Table.deleteMany({ tenantId: { $in: [tenantId, tenantIdOther] } });
    await Order.deleteMany({ tenantId: { $in: [tenantId, tenantIdOther] } });
    await User.deleteMany({ tenantId: { $in: [tenantId, tenantIdOther] } });
    await Employee.deleteMany({ tenantId: { $in: [tenantId, tenantIdOther] } });

    await Restaurant.create({
      _id: restaurantId,
      tenantId,
      name: 'DineX QA Bistro',
      legalName: 'DineX QA Foods Ltd',
      email: 'qa@dinex.app',
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
      name: 'Connaught Place QA Branch',
      code: 'QA-CP-01',
      email: 'qa-cp@dinex.app',
      phone: '+919876543210',
      address: {
        label: 'Main',
        recipientName: 'Manager',
        phone: '+919876543210',
        addressLine1: 'Connaught Place Block A',
        city: 'New Delhi',
        state: 'Delhi',
        postalCode: '110001',
        country: 'India',
      },
      timezone: 'Asia/Kolkata',
      status: 'ACTIVE',
      serviceModes: ['dine_in', 'takeaway', 'delivery'],
    });

    await User.create({
      _id: customerUserId,
      tenantId,
      name: 'QA Customer',
      email: 'qa.customer@dinex.test',
      passwordHash: 'hashed_password_123',
      phone: '+919811122233',
      accountStatus: 'active',
      emailVerified: true,
    });

    await User.create({
      _id: driverUserId,
      tenantId,
      name: 'QA Driver',
      email: 'qa.driver@dinex.test',
      passwordHash: 'hashed_password_123',
      phone: '+919899988877',
      accountStatus: 'active',
      emailVerified: true,
    });

    await Employee.create({
      _id: driverEmployeeId,
      tenantId,
      userId: driverUserId,
      employeeNumber: 'EMP-QA-DRV-01',
      employmentStatus: 'active',
      employmentType: 'full_time',
      primaryBranchId: branchId,
      branchIds: [branchId],
      jobTitle: 'Delivery Rider',
    });
  });

  after(async () => {
    await Restaurant.deleteMany({ tenantId: { $in: [tenantId, tenantIdOther] } });
    await Branch.deleteMany({ tenantId: { $in: [tenantId, tenantIdOther] } });
    await Table.deleteMany({ tenantId: { $in: [tenantId, tenantIdOther] } });
    await Order.deleteMany({ tenantId: { $in: [tenantId, tenantIdOther] } });
    await User.deleteMany({ tenantId: { $in: [tenantId, tenantIdOther] } });
    await Employee.deleteMany({ tenantId: { $in: [tenantId, tenantIdOther] } });

    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });

  test('1. End-to-End Dine-In QR Order Journey: Table Create -> QR Token -> Menu -> Checkout -> Status', async () => {
    // 1. Create table & generate QR token
    const tableInput = tableCreateSchema.parse({
      branchId: branchId.toString(),
      tableNumber: 'T-QA-24',
      capacity: 4,
      section: 'Main Dining',
    });

    const table = await qrTokenService.createTable(tableInput, mockAdminActor);
    assert.ok(table);
    assert.equal(table.tableNumber, 'T-QA-24');
    assert.ok(table.qrToken.startsWith('qr_tok_'));

    // 2. Validate token
    const validated = await qrTokenService.validateQRToken(table.qrToken);
    assert.equal(validated.tableNumber, 'T-QA-24');

    // 3. Fetch public menu
    const menuData = await qrMenuService.getPublicQRMenu(table.qrToken);
    assert.equal(menuData.context.tableNumber, 'T-QA-24');

    // 4. Checkout order with zero-trust pricing
    const checkoutInput = qrCheckoutSchema.parse({
      token: table.qrToken,
      guestName: 'Dine-In QA Guest',
      items: [
        { menuItemId: 'ITEM-101', quantity: 1 }, // Butter Chicken ₹420
        { menuItemId: 'ITEM-103', quantity: 2 }, // Garlic Naan ₹240
      ],
    });

    const checkoutResult = await qrCheckoutService.checkoutQROrder(checkoutInput);
    assert.ok(checkoutResult.orderId);
    assert.equal(checkoutResult.subtotal, 660);
    assert.equal(checkoutResult.taxAmount, 33);
    assert.equal(checkoutResult.grandTotal, 693);
    assert.equal(checkoutResult.status, 'placed');

    // 5. Track live order status
    const statusData = await qrStatusService.getQROrderStatus(checkoutResult.orderId);
    assert.equal(statusData.status, 'placed');
    assert.equal(statusData.tableNumber, 'T-QA-24');
  });

  test('2. End-to-End Delivery Order Journey: Address -> Checkout -> Driver Assign -> Fulfill -> Track', async () => {
    // 1. Add customer delivery address
    const newAddr = await addressService.addCustomerDeliveryAddress(mockCustomerActor, {
      label: 'Home',
      recipientName: 'QA Customer',
      phone: '+919811122233',
      addressLine1: 'Connaught Place Block B',
      city: 'New Delhi',
      state: 'Delhi',
      postalCode: '110001',
      isDefault: true,
    });
    assert.ok(newAddr);

    // 2. Checkout delivery order
    const checkoutInput = deliveryCheckoutSchema.parse({
      branchId: branchId.toString(),
      guestName: 'QA Customer',
      guestPhone: '+919811122233',
      deliveryAddress: {
        label: 'Home',
        recipientName: 'QA Customer',
        phone: '+919811122233',
        addressLine1: 'Connaught Place Block B',
        city: 'New Delhi',
        state: 'Delhi',
        postalCode: '110001',
      },
      paymentMethod: 'cod',
      items: [
        { menuItemId: 'ITEM-101', quantity: 1 },
        { menuItemId: 'ITEM-103', quantity: 1 },
      ],
    });

    const deliveryResult = await fulfillmentService.checkoutDeliveryOrder(checkoutInput, mockCustomerActor);
    assert.ok(deliveryResult.orderId);
    assert.equal(deliveryResult.status, 'placed');

    // 3. Assign delivery driver
    const assignedOrder = await fulfillmentService.assignDeliveryDriver(
      deliveryResult.orderId,
      driverEmployeeId.toString(),
      mockAdminActor,
    );
    assert.equal(assignedOrder.status, 'assigned');

    // 4. Driver updates status to out_for_delivery & delivered
    const outOrder = await fulfillmentService.updateDeliveryStatus(
      deliveryResult.orderId,
      { status: 'out_for_delivery' },
      mockDriverActor,
    );
    assert.equal(outOrder.status, 'out_for_delivery');

    const deliveredOrder = await fulfillmentService.updateDeliveryStatus(
      deliveryResult.orderId,
      { status: 'delivered' },
      mockDriverActor,
    );
    assert.equal(deliveredOrder.status, 'delivered');

    // 5. Customer delivery tracking
    const tracking = await fulfillmentService.getDeliveryOrderStatus(deliveryResult.orderId, mockCustomerActor);
    assert.equal(tracking.status, 'delivered');
  });

  test('3. Realtime Socket.IO Emitters: User & Branch event emission', () => {
    assert.doesNotThrow(() => {
      socketService.emitToUserRoom(customerUserId.toString(), 'order_updated', { status: 'preparing' });
      socketService.emitToBranchRoom(branchId.toString(), 'kitchen_new_order', { orderNumber: 'DEL-101' });
    });
  });

  test('4. Cross-Tenant Security Boundary Isolation: Other tenant actor fails to access order', async () => {
    const existingOrder = await Order.findOne({ tenantId }).lean();
    assert.ok(existingOrder);

    await assert.rejects(
      async () => {
        await fulfillmentService.getDeliveryOrderStatus(
          existingOrder._id.toString(),
          mockOtherTenantActor,
        );
      },
      {
        name: 'AppError',
        message: 'Delivery order not found.',
      },
    );
  });
});
