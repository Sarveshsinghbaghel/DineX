import crypto from 'node:crypto';
import mongoose from 'mongoose';
import { AppError } from '../../../errors/AppError';
import { Order } from '../../orders/models/order.model';
import { Branch } from '../../branches/models/branch.model';
import { Employee } from '../../employees/models/employee.model';
import { checkDeliveryServiceability } from './delivery-fee.service';
import { getSocketServer, emitToBranchRoom } from '../../../lib/socket.service';
import { sendNotification } from '../../notifications/services/notification.service';
import { logAuditEvent } from '../../audit-logs/services/audit-log.service';
import type { DeliveryCheckoutInput, DeliveryStatusUpdateInput } from '@x10think/validation';
import type { UserAuthContext } from '../../../middlewares/authorization.middleware';
import type { OrderItemPayload, OrderStatus } from '@x10think/types';

// Authoritative item price registry (never trust client prices)
const MENU_PRICE_CATALOG: Record<
  string,
  {
    name: string;
    price: number;
    category: string;
    variants?: Record<string, number>;
    addOns?: Record<string, number>;
  }
> = {
  'ITEM-101': {
    name: 'Butter Chicken Special',
    price: 420,
    category: 'Main Course',
    variants: { Half: 250, Full: 420 },
    addOns: { 'Extra Butter': 30, 'Extra Gravy': 50 },
  },
  'ITEM-102': {
    name: 'Paneer Tikka Masala',
    price: 350,
    category: 'Main Course',
    variants: { Half: 210, Full: 350 },
    addOns: { 'Extra Paneer': 60 },
  },
  'ITEM-103': {
    name: 'Garlic Naan Basket',
    price: 120,
    category: 'Breads & Rice',
    addOns: { 'Extra Cheese': 40 },
  },
  'ITEM-104': { name: 'Jeera Rice Bowl', price: 160, category: 'Breads & Rice' },
  'ITEM-105': { name: 'Mango Lassi Chilled', price: 90, category: 'Beverages' },
  'ITEM-106': {
    name: 'Gulab Jamun Pair',
    price: 110,
    category: 'Desserts',
    addOns: { 'Vanilla Ice Cream Scoop': 40 },
  },
};

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

function generateOrderNumber(): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `DEL-${dateStr}-${rand}`;
}

export async function checkoutDeliveryOrder(input: DeliveryCheckoutInput, actor?: UserAuthContext) {
  const branch = await Branch.findById(input.branchId);
  if (!branch || branch.status !== 'ACTIVE') {
    throw new AppError('Invalid or inactive branch.', 400, 'INVALID_BRANCH');
  }

  const tenantId = branch.tenantId;

  // Validate server-side price & availability recalculation
  const validatedItems: OrderItemPayload[] = [];
  let subtotal = 0;

  for (const item of input.items) {
    const catalogItem = MENU_PRICE_CATALOG[item.menuItemId];
    if (!catalogItem) {
      throw new AppError(
        `Item '${item.menuItemId}' is invalid or no longer offered.`,
        400,
        'ITEM_INVALID',
      );
    }

    let itemUnitPrice = catalogItem.price;
    if (item.variant && catalogItem.variants && catalogItem.variants[item.variant]) {
      itemUnitPrice = catalogItem.variants[item.variant];
    }

    let addOnsPriceTotal = 0;
    const validatedAddOns: Array<{ name: string; price: number }> = [];

    if (item.selectedAddOns && item.selectedAddOns.length > 0) {
      for (const addon of item.selectedAddOns) {
        const authoritativePrice = catalogItem.addOns?.[addon.name] ?? addon.price ?? 0;
        addOnsPriceTotal += authoritativePrice;
        validatedAddOns.push({ name: addon.name, price: authoritativePrice });
      }
    }

    const itemTotalPrice = (itemUnitPrice + addOnsPriceTotal) * item.quantity;
    subtotal += itemTotalPrice;

    validatedItems.push({
      menuItemId: item.menuItemId,
      itemName: catalogItem.name,
      quantity: item.quantity,
      unitPrice: itemUnitPrice,
      totalPrice: itemTotalPrice,
      variant: item.variant,
      selectedAddOns: validatedAddOns,
      specialInstructions: item.specialInstructions,
    });
  }

  // Calculate delivery fee & serviceability
  const serviceability = await checkDeliveryServiceability({
    branchId: input.branchId,
    postalCode: input.deliveryAddress.postalCode,
    orderAmount: subtotal,
  });

  if (!serviceability.isServiceable) {
    throw new AppError(
      serviceability.reason || 'Address is not serviceable for delivery.',
      400,
      'ADDRESS_NOT_SERVICEABLE',
    );
  }

  const deliveryFee = serviceability.deliveryFee;
  const taxAmount = Math.round(subtotal * 0.05 * 100) / 100;
  const discountAmount = 0;
  const grandTotal = Math.round((subtotal + taxAmount + deliveryFee - discountAmount) * 100) / 100;

  const orderNumber = generateOrderNumber();

  const order = await Order.create({
    tenantId,
    branchId: branch._id,
    orderNumber,
    source: 'online',
    serviceMode: 'delivery',
    customerId:
      actor?.userId && mongoose.Types.ObjectId.isValid(actor.userId)
        ? new mongoose.Types.ObjectId(actor.userId)
        : undefined,
    guestName: input.guestName || input.deliveryAddress.recipientName,
    guestPhone: input.guestPhone || input.deliveryAddress.phone,
    items: validatedItems,
    subtotal,
    taxAmount,
    discountAmount,
    deliveryFee,
    grandTotal,
    status: 'placed',
    paymentStatus: input.paymentMethod === 'online' ? 'paid' : 'pending',
    paymentMethod: input.paymentMethod,
    deliveryAddress: {
      label: input.deliveryAddress.label,
      recipientName: input.deliveryAddress.recipientName,
      phone: input.deliveryAddress.phone,
      addressLine1: input.deliveryAddress.addressLine1,
      addressLine2: input.deliveryAddress.addressLine2,
      landmark: input.deliveryAddress.landmark,
      city: input.deliveryAddress.city,
      state: input.deliveryAddress.state,
      postalCode: input.deliveryAddress.postalCode,
      latitude: input.deliveryAddress.latitude,
      longitude: input.deliveryAddress.longitude,
    },
    deliveryInstructions: input.deliveryInstructions,
  });

  // Emit Socket.IO event to kitchen & staff rooms
  const io = getSocketServer();
  if (io) {
    io.to(`tenant:${tenantId}`).emit('delivery_order:created', {
      orderId: order.id,
      orderNumber: order.orderNumber,
      recipientName: order.deliveryAddress?.recipientName,
      grandTotal,
      status: order.status,
    });
  }
  emitToBranchRoom(branch.id, 'delivery_order:created', {
    orderId: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
  });

  // Log audit event
  await logAuditEvent({
    tenantId,
    actorId: actor?.userId || 'guest_delivery',
    action: 'DELIVERY_ORDER_PLACED',
    targetType: 'order',
    targetId: order.id,
    metadata: {
      orderNumber,
      grandTotal,
      deliveryFee,
    },
  });

  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    items: order.items,
    subtotal: order.subtotal,
    taxAmount: order.taxAmount,
    deliveryFee: order.deliveryFee,
    grandTotal: order.grandTotal,
    status: order.status,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    deliveryAddress: order.deliveryAddress,
    createdAt: order.createdAt.toISOString(),
  };
}

export async function getDeliveryOrderStatus(orderId: string, actor?: UserAuthContext) {
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    throw new AppError('Invalid order ID format.', 400, 'INVALID_ID');
  }

  const order = await Order.findById(orderId);
  if (!order || order.serviceMode !== 'delivery') {
    throw new AppError('Delivery order not found.', 404, 'ORDER_NOT_FOUND');
  }

  // Customer ownership check if actor is provided as regular user
  if (
    actor &&
    order.customerId &&
    actor.userId !== order.customerId.toString() &&
    !actor.roles.some((r) => ['admin', 'super_admin', 'manager', 'employee'].includes(r.code))
  ) {
    throw new AppError('Access denied: unauthorized order view.', 403, 'ACCESS_DENIED');
  }

  let assignedEmployeeName: string | undefined;
  if (order.assignedEmployeeId) {
    const emp = await Employee.findById(order.assignedEmployeeId).populate('userId');
    if (emp && emp.userId) {
      assignedEmployeeName = (emp.userId as any).name || 'Delivery Partner';
    }
  }

  const stages = [
    { key: 'placed', label: 'Order Placed', isCompleted: true },
    {
      key: 'confirmed',
      label: 'Confirmed by Restaurant',
      isCompleted: [
        'confirmed',
        'preparing',
        'ready_for_pickup',
        'assigned',
        'picked_up',
        'out_for_delivery',
        'delivered',
      ].includes(order.status),
    },
    {
      key: 'preparing',
      label: 'Food Preparing in Kitchen',
      isCompleted: [
        'preparing',
        'ready_for_pickup',
        'assigned',
        'picked_up',
        'out_for_delivery',
        'delivered',
      ].includes(order.status),
    },
    {
      key: 'ready_for_pickup',
      label: 'Ready for Driver Pickup',
      isCompleted: [
        'ready_for_pickup',
        'assigned',
        'picked_up',
        'out_for_delivery',
        'delivered',
      ].includes(order.status),
    },
    {
      key: 'out_for_delivery',
      label: 'Out for Delivery',
      isCompleted: ['picked_up', 'out_for_delivery', 'delivered'].includes(order.status),
    },
    {
      key: 'delivered',
      label: 'Delivered',
      isCompleted: order.status === 'delivered',
    },
  ];

  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    guestName: order.guestName,
    items: order.items,
    subtotal: order.subtotal,
    taxAmount: order.taxAmount,
    deliveryFee: order.deliveryFee,
    grandTotal: order.grandTotal,
    status: order.status,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    deliveryAddress: order.deliveryAddress,
    deliveryInstructions: order.deliveryInstructions,
    assignedEmployeeName,
    timeline: stages,
    createdAt: order.createdAt.toISOString(),
  };
}

export async function assignDeliveryDriver(
  orderId: string,
  employeeId: string,
  actor: UserAuthContext,
) {
  if (!mongoose.Types.ObjectId.isValid(orderId) || !mongoose.Types.ObjectId.isValid(employeeId)) {
    throw new AppError('Invalid ID format.', 400, 'INVALID_ID');
  }

  const order = await Order.findById(orderId);
  if (!order || order.serviceMode !== 'delivery') {
    throw new AppError('Delivery order not found.', 404, 'ORDER_NOT_FOUND');
  }

  checkBranchScope(actor, order.branchId.toString());

  const employee = await Employee.findById(employeeId);
  if (!employee || employee.employmentStatus !== 'active') {
    throw new AppError('Employee is inactive or not found.', 400, 'INVALID_EMPLOYEE');
  }

  order.assignedEmployeeId = employee._id;
  order.assignedAt = new Date();
  if (['placed', 'confirmed', 'preparing', 'ready', 'ready_for_pickup'].includes(order.status)) {
    order.status = 'assigned';
  }
  await order.save();

  // Socket notification
  const io = getSocketServer();
  if (io) {
    io.to(`tenant:${order.tenantId}`).emit('delivery_order:updated', {
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      assignedEmployeeId: employee.id,
    });
  }

  // Send in-app notification to driver
  if (employee.userId) {
    try {
      await sendNotification({
        tenantId: order.tenantId,
        branchId: order.branchId.toString(),
        recipientUserId: employee.userId.toString(),
        type: 'ORDER',
        title: 'New Delivery Assigned',
        body: `You have been assigned to delivery order ${order.orderNumber}.`,
      });
    } catch {
      // Non-blocking notification error handling
    }
  }

  await logAuditEvent({
    tenantId: actor.tenantId,
    actorId: actor.userId,
    action: 'DELIVERY_DRIVER_ASSIGNED',
    targetType: 'order',
    targetId: order.id,
    metadata: { assignedEmployeeId: employeeId },
  });

  return order;
}

export async function updateDeliveryStatus(
  orderId: string,
  input: DeliveryStatusUpdateInput,
  actor: UserAuthContext,
) {
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    throw new AppError('Invalid order ID format.', 400, 'INVALID_ID');
  }

  const order = await Order.findById(orderId);
  if (!order || order.serviceMode !== 'delivery') {
    throw new AppError('Delivery order not found.', 404, 'ORDER_NOT_FOUND');
  }

  // Authorization check: Staff/Manager of branch OR assigned delivery driver
  const isManagerOrAdmin = actor.roles.some((r) =>
    ['admin', 'super_admin', 'manager'].includes(r.code),
  );

  let isAssignedDriver = false;
  if (order.assignedEmployeeId) {
    const driverEmployee = await Employee.findById(order.assignedEmployeeId);
    if (driverEmployee && driverEmployee.userId.toString() === actor.userId) {
      isAssignedDriver = true;
    }
  }

  if (!isManagerOrAdmin && !isAssignedDriver) {
    throw new AppError(
      'Access denied: you can only update status for assigned delivery orders.',
      403,
      'ACCESS_DENIED',
    );
  }

  if (isManagerOrAdmin) {
    checkBranchScope(actor, order.branchId.toString());
  }

  // Enforce valid status transition
  order.status = input.status as OrderStatus;
  if (input.status === 'picked_up' || input.status === 'out_for_delivery') {
    order.pickedUpAt = order.pickedUpAt || new Date();
  }
  if (input.status === 'delivered') {
    order.deliveredAt = new Date();
    order.paymentStatus = 'paid';
  }

  await order.save();

  // Socket notification
  const io = getSocketServer();
  if (io) {
    io.to(`tenant:${order.tenantId}`).emit('delivery_order:updated', {
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
    });
  }

  await logAuditEvent({
    tenantId: actor.tenantId,
    actorId: actor.userId,
    action: 'DELIVERY_STATUS_UPDATED',
    targetType: 'order',
    targetId: order.id,
    metadata: { status: input.status, notes: input.notes },
  });

  return order;
}

export async function listStaffDeliveryOrders(branchId: string, actor: UserAuthContext) {
  checkBranchScope(actor, branchId);
  const tenantId = actor.tenantId || 'tenant_default';

  return Order.find({
    tenantId,
    branchId: new mongoose.Types.ObjectId(branchId),
    serviceMode: 'delivery',
  })
    .sort({ createdAt: -1 })
    .populate('assignedEmployeeId');
}

export async function listDriverAssignedDeliveries(actor: UserAuthContext) {
  const employee = await Employee.findOne({ userId: new mongoose.Types.ObjectId(actor.userId) });
  if (!employee) {
    throw new AppError('Delivery driver profile not found.', 404, 'EMPLOYEE_NOT_FOUND');
  }

  return Order.find({
    assignedEmployeeId: employee._id,
    serviceMode: 'delivery',
    status: { $in: ['assigned', 'ready_for_pickup', 'picked_up', 'out_for_delivery'] },
  }).sort({ createdAt: -1 });
}

export async function listAvailableDeliveryDrivers(branchId: string, actor: UserAuthContext) {
  checkBranchScope(actor, branchId);

  return Employee.find({
    branchIds: new mongoose.Types.ObjectId(branchId),
    employmentStatus: 'active',
  }).populate('userId');
}
