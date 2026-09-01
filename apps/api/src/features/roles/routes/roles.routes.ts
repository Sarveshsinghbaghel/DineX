import { Router } from 'express';
import { requireAuth, requirePermission } from '../../../middlewares/authorization.middleware';
import * as rolesController from '../controllers/roles.controller';

export const rolesRouter = Router();

rolesRouter.use(requireAuth);

rolesRouter.get('/', requirePermission('roles.read'), rolesController.listRoles);
rolesRouter.get('/:roleId', requirePermission('roles.read'), rolesController.getRole);
rolesRouter.post('/', requirePermission('roles.manage'), rolesController.createRole);
rolesRouter.patch('/:roleId', requirePermission('roles.manage'), rolesController.updateRole);
rolesRouter.delete('/:roleId', requirePermission('roles.manage'), rolesController.deleteRole);

rolesRouter.post('/:roleId/permissions', requirePermission('roles.manage'), rolesController.assignPermissions);
rolesRouter.delete(
  '/:roleId/permissions/:permissionId',
  requirePermission('roles.manage'),
  rolesController.removePermission,
);
