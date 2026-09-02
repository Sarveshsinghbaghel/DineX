import type { NextFunction, Request, Response } from 'express';
import { sendSuccessResponse } from '../../../utils/api-response';
import * as reportService from '../services/report.service';
import { reportPreviewSchema, reportExportSchema } from '@x10think/validation';

export async function previewReport(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const query = reportPreviewSchema.parse(req.query);
    const result = await reportService.previewReport(query, req.user!);
    sendSuccessResponse(res, { message: 'Report dataset generated for preview.', data: result });
  } catch (err) {
    next(err);
  }
}

export async function exportReport(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = reportExportSchema.parse({ ...req.query, ...req.body });
    const result = await reportService.exportReport(body, req.user!);

    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.status(200).send(result.buffer);
  } catch (err) {
    next(err);
  }
}

export async function listReportHistory(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await reportService.listReportHistory(req.user!);
    sendSuccessResponse(res, { message: 'Report history listed.', data: result });
  } catch (err) {
    next(err);
  }
}
