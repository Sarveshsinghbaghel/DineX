import { Router } from 'express';
import { requireAuth, requirePermission } from '../../../middlewares/authorization.middleware';
import * as controller from '../controllers/notification.controller';

export const notificationRouter = Router();

notificationRouter.use(requireAuth);

notificationRouter.get('/', controller.listUserNotifications);
notificationRouter.get('/unread-count', controller.getUnreadCount);
notificationRouter.post('/read-all', controller.markAllAsRead);
notificationRouter.post('/:notificationId/read', controller.markAsRead);

notificationRouter.post(
  '/broadcast',
  requirePermission('notifications.broadcast'),
  controller.broadcastNotification,
);
