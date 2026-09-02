import crypto from 'node:crypto';
import mongoose from 'mongoose';
import { AppError } from '../../../errors/AppError';
import { Table } from '../../tables/models/table.model';
import { Order } from '../../orders/models/order.model';
import { validateQRToken } from './qr-token.service';
import { getSocketServer } from '../../../lib/socket.service';
import { sendNotification } from '../../notifications/services/notification.service';
import { logAuditEvent } from '../../audit-logs/services/audit-log.service';
import type { QRCheckoutInput } from '@x10think/validation';
import type { UserAuthContext } from '../../../middlewares/authorization.middleware';
import type { OrderItemPayload } from '@x10think/types';

// Authoritative item price registry (never trust client prices)
const MENU_PRICE_CATALOG: Record<string, { name: string; price: number; category: string }> = {
  'ITEM-101': { name: 'Butter Chicken Special', price: 420, category: 'Main Course' },
  'ITEM-102': { name: 'Paneer Tikka Masala', price: 350, category: 'Main Course' },
  'ITEM-103': { name: 'Garlic Naan Basket', price: 120, category: 'Breads & Rice' },
  'ITEM-104': { name: 'Jeera Rice Bowl', price: 160, category: 'Breads & Rice' },
  'ITEM-105': { name: 'Mango Lassi Chilled', price: 90, category: 'Beverages' },
  'ITEM-106': { name: 'Gulab Jamun Pair', price: 110, category: 'Desserts' },
};

function generateOrderNumber(): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `ORD-${dateStr}-${rand}`;
}

export async function checkoutQROrder(input: QRCheckoutInput, actor?: UserAuthContext) {
  // Validate token & table
  await validateQRToken(input.token);
  const table = await Table.findOne({ qrToken: input.token });

  if (!table || table.qrStatus !== 'active') {
    throw new AppError('Invalid or inactive QR token.', 400, 'QR_INVALID');
  }

  const tenantId = table.tenantId;
  const branchId = table.branchId;

  // Server-side price & availability recalculation
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

    // Process add-ons if selected
    let addOnsPriceTotal = 0;
    if (item.selectedAddOns && item.selectedAddOns.length > 0) {
      addOnsPriceTotal = item.selectedAddOns.reduce((acc, a) => acc + (a.price || 0), 0);
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
      selectedAddOns: item.selectedAddOns,
      specialInstructions: item.specialInstructions,
    });
  }

  // Calculate taxes (5% GST)
  const taxAmount = Math.round(subtotal * 0.05 * 100) / 100;
  const discountAmount = 0;
  const grandTotal = Math.round((subtotal + taxAmount - discountAmount) * 100) / 100;

  const orderNumber = generateOrderNumber();

  // Create Order
  const order = await Order.create({
    tenantId,
    branchId,
    tableId: table._id,
    orderNumber,
    source: 'qr',
    customerId:
      actor?.userId && mongoose.Types.ObjectId.isValid(actor.userId)
        ? new mongoose.Types.ObjectId(actor.userId)
        : undefined,
    guestName: input.guestName || 'Guest Customer',
    items: validatedItems,
    subtotal,
    taxAmount,
    discountAmount,
    grandTotal,
    status: 'placed',
    paymentStatus: 'pending',
    sessionId: `sess_table_${table.tableNumber}_${Date.now()}`,
  });

  // Update table status to occupied
  table.status = 'occupied';
  await table.save();

  // Emit Socket.IO realtime notification to kitchen & staff rooms
  const io = getSocketServer();
  if (io) {
    io.to(`tenant:${tenantId}`).emit('qr_order:created', {
      orderId: order.id,
      orderNumber: order.orderNumber,
      tableNumber: table.tableNumber,
      section: table.section,
      itemCount: validatedItems.length,
      grandTotal,
      status: order.status,
    });
  }

  // Send in-app notification if recipient user exists
  if (actor?.userId && mongoose.Types.ObjectId.isValid(actor.userId)) {
    try {
      await sendNotification({
        tenantId,
        branchId: branchId.toString(),
        recipientUserId: actor.userId,
        type: 'ORDER',
        title: 'New QR Order Received',
        body: `Table ${table.tableNumber} (${table.section}) placed QR Order ${orderNumber} for ₹${grandTotal}.`,
      });
    } catch {
      // Non-blocking notification creation
    }
  }

  // Log audit event
  await logAuditEvent({
    tenantId,
    actorId: actor?.userId || 'guest_qr',
    action: 'QR_ORDER_PLACED',
    targetType: 'order',
    targetId: order.id,
    metadata: {
      orderNumber,
      tableNumber: table.tableNumber,
      grandTotal,
    },
  });

  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    tableNumber: table.tableNumber,
    section: table.section,
    items: order.items,
    subtotal: order.subtotal,
    taxAmount: order.taxAmount,
    grandTotal: order.grandTotal,
    status: order.status,
    createdAt: order.createdAt.toISOString(),
  };
}
