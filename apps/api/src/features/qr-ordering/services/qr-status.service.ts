import mongoose from 'mongoose';
import { AppError } from '../../../errors/AppError';
import { Order } from '../../orders/models/order.model';
import { Table } from '../../tables/models/table.model';

export async function getQROrderStatus(orderId: string) {
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    throw new AppError('Invalid order ID format.', 400, 'INVALID_ID');
  }

  const order = await Order.findById(orderId);
  if (!order) {
    throw new AppError('Order not found.', 404, 'ORDER_NOT_FOUND');
  }

  const table = await Table.findById(order.tableId);

  // Timeline stage progression helper
  const stages = [
    { key: 'placed', label: 'Order Placed', isCompleted: true },
    {
      key: 'confirmed',
      label: 'Confirmed by Kitchen',
      isCompleted: ['confirmed', 'preparing', 'ready', 'served', 'completed'].includes(
        order.status,
      ),
    },
    {
      key: 'preparing',
      label: 'Food Preparing',
      isCompleted: ['preparing', 'ready', 'served', 'completed'].includes(order.status),
    },
    {
      key: 'ready',
      label: 'Ready for Service',
      isCompleted: ['ready', 'served', 'completed'].includes(order.status),
    },
    {
      key: 'served',
      label: 'Served to Table',
      isCompleted: ['served', 'completed'].includes(order.status),
    },
  ];

  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    tableNumber: table?.tableNumber || 'N/A',
    section: table?.section || 'N/A',
    guestName: order.guestName,
    items: order.items,
    subtotal: order.subtotal,
    taxAmount: order.taxAmount,
    grandTotal: order.grandTotal,
    status: order.status,
    paymentStatus: order.paymentStatus,
    timeline: stages,
    createdAt: order.createdAt.toISOString(),
  };
}
