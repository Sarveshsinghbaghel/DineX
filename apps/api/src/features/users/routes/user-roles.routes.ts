import { Router } from 'express';
import { requireAuth, requirePermission } from '../../../middlewares/authorization.middleware';
import * as userRolesController from '../controllers/user-roles.controller';

export const userRolesRouter = Router();

userRolesRouter.use(requireAuth);

userRolesRouter.post(
  '/:userId/roles',
  requirePermission('roles.assign'),
  userRolesController.assignUserRoles,
);
userRolesRouter.delete(
  '/:userId/roles/:roleId',
  requirePermission('roles.assign'),
  userRolesController.removeUserRole,
);
