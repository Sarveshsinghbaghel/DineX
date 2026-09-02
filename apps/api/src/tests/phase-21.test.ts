import assert from 'node:assert/strict';
import { test, describe, before, after } from 'node:test';
import mongoose from 'mongoose';

import { Restaurant } from '../features/restaurants/models/restaurant.model';
import { Branch } from '../features/branches/models/branch.model';
import { User } from '../features/auth/models/auth.models';
import { Employee } from '../features/employees/models/employee.model';
import { Order } from '../features/orders/models/order.model';

import * as addressService from '../features/delivery/services/delivery-address.service';
import * as feeService from '../features/delivery/services/delivery-fee.service';
import * as fulfillmentService from '../features/delivery/services/delivery-fulfillment.service';

import { deliveryCheckoutSchema } from '@x10think/validation';
import type { UserAuthContext } from '../middlewares/authorization.middleware';

describe('DineX Phase 21: Delivery & Order Fulfillment Integration Test Suite', () => {
  const tenantId = 'tenant_test_del_21';
  const restaurantId = new mongoose.Types.ObjectId();
  const branchId = new mongoose.Types.ObjectId();

  const customerUserId = new mongoose.Types.ObjectId();
  const driverUserId = new mongoose.Types.ObjectId();
  const driverEmployeeId = new mongoose.Types.ObjectId();
  const otherDriverUserId = new mongoose.Types.ObjectId();
  const otherDriverEmployeeId = new mongoose.Types.ObjectId();

  const mockCustomerActor: UserAuthContext = {
    userId: customerUserId.toString(),
    sessionId: 'sess_cust_del',
    tenantId,
    roles: [{ _id: 'r_cust', name: 'Customer', code: 'customer', isSystem: true }],
    permissions: [],
  };

  const mockAdminActor: UserAuthContext = {
    userId: new mongoose.Types.ObjectId().toString(),
    sessionId: 'sess_admin_del',
    tenantId,
    roles: [{ _id: 'r_admin', name: 'Admin', code: 'admin', isSystem: true }],
    permissions: ['delivery.view', 'delivery.manage', 'orders.read'],
  };

  const mockDriverActor: UserAuthContext = {
    userId: driverUserId.toString(),
    sessionId: 'sess_driver_del',
    tenantId,
    branchIds: [branchId.toString()],
    roles: [{ _id: 'r_driver', name: 'Employee', code: 'employee', isSystem: true }],
    permissions: ['delivery.fulfill'],
  };

  const mockOtherDriverActor: UserAuthContext = {
    userId: otherDriverUserId.toString(),
    sessionId: 'sess_other_driver_del',
    tenantId,
    branchIds: [branchId.toString()],
    roles: [{ _id: 'r_driver2', name: 'Employee', code: 'employee', isSystem: true }],
    permissions: ['delivery.fulfill'],
  };

  let savedAddressId: string;
  let createdDeliveryOrderId: string;

  before(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dinex-test');
    }

    await Restaurant.deleteMany({ tenantId });
    await Branch.deleteMany({ tenantId });
    await User.deleteMany({ tenantId });
    await Employee.deleteMany({ tenantId });
    await Order.deleteMany({ tenantId });

    await Restaurant.create({
      _id: restaurantId,
      tenantId,
      name: 'DineX Express Kitchen',
      legalName: 'DineX Delivery Foods Ltd',
      email: 'express@dinex.app',
      phone: '+919876543210',
      address: {
        label: 'Main',
        recipientName: 'Manager',
        phone: '+919876543210',
        addressLine1: 'Cyber City',
        city: 'Gurugram',
        state: 'Haryana',
        postalCode: '122002',
        country: 'India',
      },
      cuisineTypes: ['North Indian', 'Fast Food'],
      status: 'ACTIVE',
      currency: 'INR',
      timezone: 'Asia/Kolkata',
    });

    await Branch.create({
      _id: branchId,
      tenantId,
      restaurantId,
      name: 'Gurugram Cyber Hub Branch',
      code: 'GUR-01',
      email: 'gurugram@dinex.app',
      phone: '+919876543210',
      address: {
        label: 'Main',
        recipientName: 'Manager',
        phone: '+919876543210',
        addressLine1: 'Cyber Hub Phase 2',
        city: 'Gurugram',
        state: 'Haryana',
        postalCode: '122002',
        country: 'India',
      },
      timezone: 'Asia/Kolkata',
      status: 'ACTIVE',
      serviceModes: ['dine_in', 'takeaway', 'delivery'],
    });

    await User.create({
      _id: customerUserId,
      tenantId,
      name: 'Rohan Malhotra',
      email: 'rohan@example.com',
      passwordHash: 'hashed_password_123',
      phone: '+919811122233',
      accountStatus: 'active',
      emailVerified: true,
    });

    await User.create({
      _id: driverUserId,
      tenantId,
      name: 'Vikram Driver',
      email: 'vikram.driver@dinex.app',
      passwordHash: 'hashed_password_123',
      phone: '+919899988877',
      accountStatus: 'active',
      emailVerified: true,
    });

    await Employee.create({
      _id: driverEmployeeId,
      tenantId,
      userId: driverUserId,
      employeeNumber: 'EMP-DRV-01',
      employmentStatus: 'active',
      employmentType: 'full_time',
      primaryBranchId: branchId,
      branchIds: [branchId],
      jobTitle: 'Delivery Rider',
    });

    await User.create({
      _id: otherDriverUserId,
      tenantId,
      name: 'Sanjay Rider',
      email: 'sanjay.rider@dinex.app',
      passwordHash: 'hashed_password_123',
      phone: '+919877766655',
      accountStatus: 'active',
      emailVerified: true,
    });

    await Employee.create({
      _id: otherDriverEmployeeId,
      tenantId,
      userId: otherDriverUserId,
      employeeNumber: 'EMP-DRV-02',
      employmentStatus: 'active',
      employmentType: 'full_time',
      primaryBranchId: branchId,
      branchIds: [branchId],
      jobTitle: 'Delivery Rider',
    });
  });

  after(async () => {
    await Restaurant.deleteMany({ tenantId });
    await Branch.deleteMany({ tenantId });
    await User.deleteMany({ tenantId });
    await Employee.deleteMany({ tenantId });
    await Order.deleteMany({ tenantId });

    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });

  test('1. Customer delivery address management (add, list, delete)', async () => {
    const newAddr = await addressService.addCustomerDeliveryAddress(mockCustomerActor, {
      label: 'Home',
      recipientName: 'Rohan Malhotra',
      phone: '+919811122233',
      addressLine1: 'Tower A, Apt 402, DLF Phase 5',
      city: 'Gurugram',
      state: 'Haryana',
      postalCode: '122002',
      isDefault: true,
    });

    assert.ok(newAddr);
    assert.equal(newAddr.label, 'Home');
    assert.equal(newAddr.postalCode, '122002');
    savedAddressId = newAddr._id.toString();
    assert.ok(savedAddressId);

    const addresses = await addressService.listCustomerDeliveryAddresses(mockCustomerActor);
    assert.equal(addresses.length, 1);
    assert.equal(addresses[0].addressLine1, 'Tower A, Apt 402, DLF Phase 5');
  });

  test('2. Branch serviceability check and delivery fee calculation', async () => {
    // Order amount below free delivery threshold -> flat fee ₹50 applies
    const check1 = await feeService.checkDeliveryServiceability({
      branchId: branchId.toString(),
      postalCode: '122002',
      orderAmount: 300,
    });

    assert.equal(check1.isServiceable, true);
    assert.equal(check1.deliveryFee, 50);

    // Order amount >= ₹500 free delivery threshold -> fee = 0
    const check2 = await feeService.checkDeliveryServiceability({
      branchId: branchId.toString(),
      postalCode: '122002',
      orderAmount: 600,
    });

    assert.equal(check2.isServiceable, true);
    assert.equal(check2.deliveryFee, 0);

    // Order amount < ₹150 minimum order amount -> not serviceable
    const check3 = await feeService.checkDeliveryServiceability({
      branchId: branchId.toString(),
      postalCode: '122002',
      orderAmount: 80,
    });

    assert.equal(check3.isServiceable, false);
    assert.ok(check3.reason?.includes('Minimum order amount'));
  });

  test('3. Server-authoritative delivery checkout & pricing recalculation', async () => {
    const checkoutInput = deliveryCheckoutSchema.parse({
      branchId: branchId.toString(),
      guestName: 'Rohan Malhotra',
      guestPhone: '+919811122233',
      deliveryAddress: {
        label: 'Home',
        recipientName: 'Rohan Malhotra',
        phone: '+919811122233',
        addressLine1: 'Tower A, Apt 402, DLF Phase 5',
        city: 'Gurugram',
        state: 'Haryana',
        postalCode: '122002',
      },
      paymentMethod: 'cod',
      items: [
        { menuItemId: 'ITEM-101', quantity: 1 }, // Butter Chicken ₹420
        { menuItemId: 'ITEM-103', quantity: 1 }, // Garlic Naan ₹120
      ],
    });

    const result = await fulfillmentService.checkoutDeliveryOrder(
      checkoutInput,
      mockCustomerActor,
    );

    assert.ok(result.orderId);
    assert.ok(result.orderNumber.startsWith('DEL-'));
    assert.equal(result.subtotal, 540); // 420 + 120
    assert.equal(result.taxAmount, 27); // 5% GST on 540
    // Subtotal 540 >= ₹500 free delivery threshold -> deliveryFee = 0
    assert.equal(result.deliveryFee, 0);
    assert.equal(result.grandTotal, 567);
    assert.equal(result.status, 'placed');
    assert.equal(result.paymentMethod, 'cod');

    createdDeliveryOrderId = result.orderId;

    // Verify order record stored in MongoDB
    const savedOrder = await Order.findById(result.orderId);
    assert.ok(savedOrder);
    assert.equal(savedOrder?.serviceMode, 'delivery');
    assert.equal(savedOrder?.source, 'online');
  });

  test('4. Delivery driver assignment by manager', async () => {
    const updated = await fulfillmentService.assignDeliveryDriver(
      createdDeliveryOrderId,
      driverEmployeeId.toString(),
      mockAdminActor,
    );

    assert.ok(updated);
    assert.equal(updated.assignedEmployeeId?.toString(), driverEmployeeId.toString());
    assert.equal(updated.status, 'assigned');
    assert.ok(updated.assignedAt);
  });

  test('5. Delivery driver assigned orders listing and status updates', async () => {
    // Driver views assigned deliveries
    const assignedList = await fulfillmentService.listDriverAssignedDeliveries(mockDriverActor);
    assert.ok(assignedList.length > 0);
    assert.equal(assignedList[0].id, createdDeliveryOrderId);

    // Driver marks order picked up / out for delivery
    const outForDelivery = await fulfillmentService.updateDeliveryStatus(
      createdDeliveryOrderId,
      { status: 'out_for_delivery' },
      mockDriverActor,
    );
    assert.equal(outForDelivery.status, 'out_for_delivery');
    assert.ok(outForDelivery.pickedUpAt);

    // Driver marks order delivered
    const delivered = await fulfillmentService.updateDeliveryStatus(
      createdDeliveryOrderId,
      { status: 'delivered' },
      mockDriverActor,
    );
    assert.equal(delivered.status, 'delivered');
    assert.equal(delivered.paymentStatus, 'paid');
    assert.ok(delivered.deliveredAt);
  });

  test('6. Security: Unauthorized driver status update restriction', async () => {
    // Place a new delivery order assigned to driver 1
    const checkoutInput = deliveryCheckoutSchema.parse({
      branchId: branchId.toString(),
      deliveryAddress: {
        label: 'Office',
        recipientName: 'Test Recipient',
        phone: '+919876543210',
        addressLine1: 'Building 10',
        city: 'Gurugram',
        state: 'Haryana',
        postalCode: '122002',
      },
      paymentMethod: 'cod',
      items: [{ menuItemId: 'ITEM-102', quantity: 1 }],
    });

    const newOrder = await fulfillmentService.checkoutDeliveryOrder(checkoutInput);
    await fulfillmentService.assignDeliveryDriver(
      newOrder.orderId,
      driverEmployeeId.toString(),
      mockAdminActor,
    );

    // Other driver attempts to update driver 1's order -> expect 403 error
    await assert.rejects(
      async () =>
        fulfillmentService.updateDeliveryStatus(
          newOrder.orderId,
          { status: 'delivered' },
          mockOtherDriverActor,
        ),
      {
        name: 'AppError',
        message: 'Access denied: you can only update status for assigned delivery orders.',
      },
    );
  });

  test('7. Customer delivery tracking', async () => {
    const tracking = await fulfillmentService.getDeliveryOrderStatus(
      createdDeliveryOrderId,
      mockCustomerActor,
    );

    assert.equal(tracking.orderNumber, (await Order.findById(createdDeliveryOrderId))?.orderNumber);
    assert.equal(tracking.status, 'delivered');
    assert.equal(tracking.assignedEmployeeName, 'Vikram Driver');
    assert.ok(tracking.timeline.length >= 5);
    assert.equal(tracking.timeline[5].isCompleted, true);
  });
});
