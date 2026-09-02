import type { NextFunction, Request, Response } from 'express';
import { sendSuccessResponse } from '../../../utils/api-response';
import * as notificationService from '../services/notification.service';
import { notificationQuerySchema, broadcastNotificationSchema } from '@x10think/validation';

export async function listUserNotifications(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const query = notificationQuerySchema.parse(req.query);
    const result = await notificationService.listUserNotifications(req.user!.userId, query);
    sendSuccessResponse(res, { message: 'Notifications retrieved.', data: result });
  } catch (err) {
    next(err);
  }
}

export async function getUnreadCount(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const count = await notificationService.getUnreadCount(req.user!.userId);
    sendSuccessResponse(res, {
      message: 'Unread notification count.',
      data: { unreadCount: count },
    });
  } catch (err) {
    next(err);
  }
}

export async function markAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await notificationService.markAsRead(
      req.params.notificationId as string,
      req.user!.userId,
    );
    sendSuccessResponse(res, { message: 'Notification marked as read.', data: result });
  } catch (err) {
    next(err);
  }
}

export async function markAllAsRead(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await notificationService.markAllAsRead(req.user!.userId);
    sendSuccessResponse(res, { message: 'All notifications marked as read.', data: result });
  } catch (err) {
    next(err);
  }
}

export async function broadcastNotification(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = broadcastNotificationSchema.parse(req.body);
    const result = await notificationService.broadcastNotification(body, req.user!);
    sendSuccessResponse(res, {
      statusCode: 202,
      message: 'Notification broadcast queued.',
      data: result,
    });
  } catch (err) {
    next(err);
  }
}
