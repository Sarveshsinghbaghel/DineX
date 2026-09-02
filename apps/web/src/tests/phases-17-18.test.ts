import {
  analyticsQuerySchema,
  reportPreviewSchema,
  reportExportSchema,
} from '@x10think/validation';

export function runFrontendPhases17To18Tests() {
  // 1. Analytics Query schema validation
  const validAnalyticsQuery = analyticsQuerySchema.safeParse({
    period: 'last_7_days',
    branchId: '6a9668c4b2e062da23aec3f5',
    timezone: 'Asia/Kolkata',
  });
  if (!validAnalyticsQuery.success) {
    throw new Error('Expected validAnalyticsQuery.success to be true');
  }

  // 2. Report Preview schema validation
  const validReportPreview = reportPreviewSchema.safeParse({
    reportType: 'taxes',
    period: 'this_month',
  });
  if (!validReportPreview.success) {
    throw new Error('Expected validReportPreview.success to be true');
  }

  // 3. Report Export schema validation
  const validReportExport = reportExportSchema.safeParse({
    reportType: 'sales',
    period: 'last_30_days',
    format: 'xlsx',
  });
  if (!validReportExport.success) {
    throw new Error('Expected validReportExport.success to be true');
  }

  return true;
}

runFrontendPhases17To18Tests();
