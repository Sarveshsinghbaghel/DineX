import { Router } from 'express';
import {
  requireAuth,
  requirePermission,
  optionalAuth,
} from '../../../middlewares/authorization.middleware';
import { checkoutLimiter } from '../../../middlewares/rate-limiters.middleware';
import * as controller from '../controllers/qr-ordering.controller';

export const qrOrderingRouter = Router();

// Public Customer QR Ordering Endpoints (No Auth or Optional Auth)
qrOrderingRouter.get('/validate/:token', controller.validateQRToken);
qrOrderingRouter.get('/menu/:token', controller.getPublicQRMenu);
qrOrderingRouter.post('/checkout/:token', checkoutLimiter, optionalAuth, controller.checkoutQROrder);
qrOrderingRouter.get('/order/:orderId/status', controller.getQROrderStatus);

// Admin & Manager Table QR Lifecycle Endpoints (Requires Auth & 'tables.manage' or 'tables.read')
qrOrderingRouter.post(
  '/tables',
  requireAuth,
  requirePermission('tables.manage'),
  controller.createTable,
);
qrOrderingRouter.get(
  '/tables/branch/:branchId',
  requireAuth,
  requirePermission('tables.read'),
  controller.listTablesByBranch,
);
qrOrderingRouter.post(
  '/tables/:tableId/generate',
  requireAuth,
  requirePermission('tables.manage'),
  controller.generateOrRegenerateQRToken,
);
qrOrderingRouter.patch(
  '/tables/:tableId/status',
  requireAuth,
  requirePermission('tables.manage'),
  controller.setTableQRStatus,
);
