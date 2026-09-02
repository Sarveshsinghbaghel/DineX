import mongoose from 'mongoose';
import { AppError } from '../../../errors/AppError';
import { Notification } from '../models/notification.model';
import { User } from '../../auth/models/auth.models';
import { emitToUserRoom } from '../../../lib/socket.service';
import { sendEmail } from '../../auth/services/email.service';
import { logAuditEvent } from '../../audit-logs/services/audit-log.service';
import type { NotificationType, NotificationChannel, NotificationPriority } from '@x10think/types';
import type { BroadcastNotificationInput, NotificationQueryInput } from '@x10think/validation';
import type { UserAuthContext } from '../../../middlewares/authorization.middleware';

export interface SendNotificationPayload {
  tenantId: string;
  recipientUserId: string;
  type: NotificationType;
  channel?: NotificationChannel;
  title: string;
  body?: string;
  data?: Record<string, unknown>;
  branchId?: string;
  priority?: NotificationPriority;
}

export async function sendNotification(payload: SendNotificationPayload) {
  if (!mongoose.Types.ObjectId.isValid(payload.recipientUserId)) {
    throw new AppError('Invalid recipient user ID format.', 400, 'INVALID_ID');
  }

  const recipient = await User.findById(payload.recipientUserId);
  if (!recipient) throw new AppError('Recipient user not found.', 404, 'USER_NOT_FOUND');

  // Check marketing/notification preferences on user if set
  if (recipient.preferences) {
    const prefs = recipient.preferences as any;
    if (
      payload.channel === 'email' &&
      prefs.marketingPreferences?.email === false &&
      payload.priority === 'low'
    ) {
      // Skip non-essential email
      return null;
    }
  }

  const notification = await Notification.create({
    tenantId: payload.tenantId,
    recipientUserId: recipient._id,
    type: payload.type,
    channel: payload.channel || 'in_app',
    title: payload.title,
    body: payload.body,
    data: payload.data,
    branchId: payload.branchId ? new mongoose.Types.ObjectId(payload.branchId) : undefined,
    priority: payload.priority || 'normal',
    status: 'delivered',
  });

  // Realtime Socket.IO emission to recipient room
  emitToUserRoom(payload.recipientUserId, 'notification:new', {
    _id: notification.id,
    type: notification.type,
    title: notification.title,
    body: notification.body,
    priority: notification.priority,
    createdAt: notification.createdAt,
  });

  // Email fallback for critical priority or explicit email channel
  if ((payload.priority === 'critical' || payload.channel === 'email') && recipient.email) {
    await sendEmail({
      to: recipient.email,
      subject: `DineX Notification: ${payload.title}`,
      text: payload.body || payload.title,
      html: `<div style="font-family: sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #f59e0b;">${payload.title}</h2>
        <p>${payload.body || ''}</p>
        <hr/>
        <small style="color: #666;">DineX Restaurant Management System</small>
      </div>`,
    });
  }

  return notification;
}

export async function listUserNotifications(userId: string, query: NotificationQueryInput) {
  if (!mongoose.Types.ObjectId.isValid(userId))
    throw new AppError('Invalid user ID format.', 400, 'INVALID_ID');

  const filter: Record<string, unknown> = {
    recipientUserId: new mongoose.Types.ObjectId(userId),
  };

  if (query.type) filter.type = query.type;
  if (query.status) filter.status = query.status;

  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const skip = (page - 1) * limit;

  const [notifications, total] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Notification.countDocuments(filter),
  ]);

  return {
    notifications,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getUnreadCount(userId: string) {
  if (!mongoose.Types.ObjectId.isValid(userId))
    throw new AppError('Invalid user ID format.', 400, 'INVALID_ID');

  return Notification.countDocuments({
    recipientUserId: new mongoose.Types.ObjectId(userId),
    readAt: { $exists: false },
  });
}

export async function markAsRead(notificationId: string, userId: string) {
  if (!mongoose.Types.ObjectId.isValid(notificationId))
    throw new AppError('Invalid notification ID format.', 400, 'INVALID_ID');

  const notification = await Notification.findOne({
    _id: new mongoose.Types.ObjectId(notificationId),
    recipientUserId: new mongoose.Types.ObjectId(userId),
  });

  if (!notification) throw new AppError('Notification not found.', 404, 'NOTIFICATION_NOT_FOUND');

  notification.status = 'read';
  notification.readAt = new Date();
  await notification.save();

  return notification;
}

export async function markAllAsRead(userId: string) {
  if (!mongoose.Types.ObjectId.isValid(userId))
    throw new AppError('Invalid user ID format.', 400, 'INVALID_ID');

  const result = await Notification.updateMany(
    {
      recipientUserId: new mongoose.Types.ObjectId(userId),
      readAt: { $exists: false },
    },
    {
      $set: { status: 'read', readAt: new Date() },
    },
  );

  return { updatedCount: result.modifiedCount };
}

export async function broadcastNotification(
  input: BroadcastNotificationInput,
  actor: UserAuthContext,
) {
  const tenantId = actor.tenantId || 'tenant_default';

  const userFilter: Record<string, unknown> = {};
  if (actor.tenantId) userFilter.tenantId = actor.tenantId;

  const users = await User.find(userFilter).limit(500);

  let count = 0;
  for (const user of users) {
    await sendNotification({
      tenantId,
      recipientUserId: user.id,
      type: input.type,
      title: input.title,
      body: input.body,
      branchId: input.branchId,
      priority: input.priority,
      data: input.data,
    });
    count++;
  }

  await logAuditEvent({
    tenantId,
    actorId: actor.userId,
    action: 'NOTIFICATION_BROADCAST',
    targetType: 'notification',
    targetId: 'broadcast',
    metadata: { title: input.title, count },
  });

  return { broadcastCount: count };
}
