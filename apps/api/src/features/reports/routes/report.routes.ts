import { Router } from 'express';
import { requireAuth, requirePermission } from '../../../middlewares/authorization.middleware';
import * as controller from '../controllers/report.controller';

export const reportRouter = Router();

reportRouter.use(requireAuth);

reportRouter.get('/preview', requirePermission('reports.read'), controller.previewReport);
reportRouter.get('/history', requirePermission('reports.read'), controller.listReportHistory);

reportRouter.get('/export', requirePermission('reports.export'), controller.exportReport);
reportRouter.post('/export', requirePermission('reports.export'), controller.exportReport);
reportRouter.post(
  '/:reportType/export',
  requirePermission('reports.export'),
  controller.exportReport,
);
