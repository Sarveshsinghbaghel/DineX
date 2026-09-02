import mongoose, { type Document, type Model } from 'mongoose';
import type { OrderSource, OrderStatus } from '@x10think/types';

export interface OrderItemDocument {
  menuItemId: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  variant?: string;
  selectedAddOns?: Array<{ name: string; price: number }>;
  specialInstructions?: string;
}

export interface OrderDocument extends Document {
  tenantId: string;
  branchId: mongoose.Types.ObjectId;
  tableId?: mongoose.Types.ObjectId;
  orderNumber: string;
  source: OrderSource;
  serviceMode?: 'dine_in' | 'takeaway' | 'delivery';
  customerId?: mongoose.Types.ObjectId;
  guestName?: string;
  guestPhone?: string;
  items: OrderItemDocument[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  deliveryFee: number;
  grandTotal: number;
  status: OrderStatus;
  paymentStatus: 'pending' | 'paid' | 'refunded';
  paymentMethod?: 'online' | 'cod' | 'card' | 'cash';
  sessionId?: string;
  deliveryAddress?: {
    label: string;
    recipientName: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    landmark?: string;
    city: string;
    state: string;
    postalCode: string;
    latitude?: number;
    longitude?: number;
  };
  deliveryInstructions?: string;
  assignedEmployeeId?: mongoose.Types.ObjectId;
  assignedAt?: Date;
  pickedUpAt?: Date;
  deliveredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new mongoose.Schema<OrderItemDocument>(
  {
    menuItemId: { type: String, required: true },
    itemName: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    totalPrice: { type: Number, required: true, min: 0 },
    variant: { type: String },
    selectedAddOns: [{ name: String, price: Number }],
    specialInstructions: { type: String, maxlength: 200 },
  },
  { _id: false },
);

const deliveryAddressSchema = new mongoose.Schema(
  {
    label: { type: String, default: 'Home' },
    recipientName: { type: String, required: true },
    phone: { type: String, required: true },
    addressLine1: { type: String, required: true },
    addressLine2: { type: String },
    landmark: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    latitude: { type: Number },
    longitude: { type: Number },
  },
  { _id: false },
);

const orderSchema = new mongoose.Schema<OrderDocument>(
  {
    tenantId: { type: String, required: true, index: true },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true, index: true },
    tableId: { type: mongoose.Schema.Types.ObjectId, ref: 'Table', index: true },
    orderNumber: { type: String, required: true, unique: true, index: true },
    source: {
      type: String,
      enum: ['qr', 'waiter', 'pos', 'online'],
      default: 'qr',
      required: true,
    },
    serviceMode: {
      type: String,
      enum: ['dine_in', 'takeaway', 'delivery'],
      default: 'dine_in',
      index: true,
    },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    guestName: { type: String, trim: true },
    guestPhone: { type: String, trim: true },
    items: [orderItemSchema],
    subtotal: { type: Number, required: true, min: 0 },
    taxAmount: { type: Number, required: true, min: 0 },
    discountAmount: { type: Number, default: 0, min: 0 },
    deliveryFee: { type: Number, default: 0, min: 0 },
    grandTotal: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: [
        'placed',
        'confirmed',
        'preparing',
        'ready',
        'served',
        'completed',
        'cancelled',
        'ready_for_pickup',
        'assigned',
        'picked_up',
        'out_for_delivery',
        'delivered',
        'failed',
        'rejected',
      ],
      default: 'placed',
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'refunded'],
      default: 'pending',
    },
    paymentMethod: {
      type: String,
      enum: ['online', 'cod', 'card', 'cash'],
      default: 'cod',
    },
    sessionId: { type: String },
    deliveryAddress: deliveryAddressSchema,
    deliveryInstructions: { type: String, maxlength: 300 },
    assignedEmployeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', index: true },
    assignedAt: { type: Date },
    pickedUpAt: { type: Date },
    deliveredAt: { type: Date },
  },
  { timestamps: true },
);

orderSchema.index({ tenantId: 1, branchId: 1, status: 1, createdAt: -1 });
orderSchema.index({ assignedEmployeeId: 1, status: 1 });
orderSchema.index({ tenantId: 1, serviceMode: 1, status: 1 });
orderSchema.index({ tenantId: 1, createdAt: -1 });

export const Order =
  (mongoose.models.Order as Model<OrderDocument>) || mongoose.model('Order', orderSchema);

