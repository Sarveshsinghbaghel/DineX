import { Router } from 'express';
import { requireAuth, requirePermission } from '../../../middlewares/authorization.middleware';
import * as controller from '../controllers/branch.controller';

export const branchRouter = Router();

branchRouter.use(requireAuth);

branchRouter.get('/', requirePermission('branches.view'), controller.listBranches);
branchRouter.post('/', requirePermission('branches.manage'), controller.createBranch);

branchRouter.get('/:branchId', requirePermission('branches.view'), controller.getBranch);
branchRouter.patch('/:branchId', requirePermission('branches.manage'), controller.updateBranch);
branchRouter.patch(
  '/:branchId/status',
  requirePermission('branches.manage'),
  controller.updateBranchStatus,
);

branchRouter.get(
  '/:branchId/settings',
  requirePermission('settings.manage'),
  controller.getBranchSettings,
);
branchRouter.patch(
  '/:branchId/settings',
  requirePermission('settings.manage'),
  controller.updateBranchSettings,
);
