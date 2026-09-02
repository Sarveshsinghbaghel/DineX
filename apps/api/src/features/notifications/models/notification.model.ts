import mongoose, { type Document, type Model } from 'mongoose';
import type {
  NotificationType,
  NotificationChannel,
  NotificationStatus,
  NotificationPriority,
} from '@x10think/types';

export interface NotificationDocument extends Document {
  tenantId: string;
  recipientUserId: mongoose.Types.ObjectId;
  type: NotificationType;
  channel: NotificationChannel;
  title: string;
  body?: string;
  data?: Record<string, unknown>;
  branchId?: mongoose.Types.ObjectId;
  priority: NotificationPriority;
  status: NotificationStatus;
  readAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
}

const notificationSchema = new mongoose.Schema<NotificationDocument>(
  {
    tenantId: { type: String, required: true, index: true },
    recipientUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        'ORDER',
        'RESERVATION',
        'PAYMENT',
        'INVENTORY',
        'SYSTEM',
        'ACCOUNT',
        'EMPLOYEE',
        'SECURITY',
      ],
      required: true,
    },
    channel: {
      type: String,
      enum: ['in_app', 'email', 'sms', 'push'],
      default: 'in_app',
    },
    title: { type: String, required: true, trim: true, maxlength: 150 },
    body: { type: String, trim: true, maxlength: 1000 },
    data: { type: mongoose.Schema.Types.Mixed },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'critical'],
      default: 'normal',
    },
    status: {
      type: String,
      enum: ['queued', 'sent', 'delivered', 'read', 'failed', 'cancelled'],
      default: 'queued',
    },
    readAt: Date,
    expiresAt: { type: Date, expires: '30d' },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

notificationSchema.index({ tenantId: 1, recipientUserId: 1, status: 1, createdAt: -1 });

export const Notification =
  (mongoose.models.Notification as Model<NotificationDocument>) ||
  mongoose.model('Notification', notificationSchema);
