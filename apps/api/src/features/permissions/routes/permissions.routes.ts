import { Router } from 'express';
import { requireAuth, requirePermission } from '../../../middlewares/authorization.middleware';
import * as permissionsController from '../controllers/permissions.controller';

export const permissionsRouter = Router();

permissionsRouter.use(requireAuth);

permissionsRouter.get(
  '/',
  requirePermission('permissions.read', 'roles.read'),
  permissionsController.listPermissions,
);
permissionsRouter.get(
  '/:permissionId',
  requirePermission('permissions.read', 'roles.read'),
  permissionsController.getPermission,
);
permissionsRouter.post(
  '/',
  requirePermission('permissions.manage'),
  permissionsController.createPermission,
);
permissionsRouter.patch(
  '/:permissionId',
  requirePermission('permissions.manage'),
  permissionsController.updatePermission,
);
