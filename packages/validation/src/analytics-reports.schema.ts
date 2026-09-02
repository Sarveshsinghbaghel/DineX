import { z } from 'zod';

export const analyticsQuerySchema = z.object({
  period: z
    .enum([
      'today',
      'yesterday',
      'last_7_days',
      'last_30_days',
      'this_month',
      'previous_month',
      'this_year',
      'custom',
    ])
    .default('last_30_days'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  branchId: z.string().optional(),
  categoryId: z.string().optional(),
  orderType: z.string().optional(),
  comparisonPeriod: z.enum(['previous_period', 'previous_year']).optional(),
  timezone: z.string().default('Asia/Kolkata'),
});

export type AnalyticsQueryInput = z.infer<typeof analyticsQuerySchema>;

export const reportPreviewSchema = z.object({
  reportType: z.enum([
    'sales',
    'revenue',
    'orders',
    'payments',
    'taxes',
    'menu',
    'inventory',
    'attendance',
    'branches',
  ]),
  period: z
    .enum([
      'today',
      'yesterday',
      'last_7_days',
      'last_30_days',
      'this_month',
      'previous_month',
      'this_year',
      'custom',
    ])
    .default('last_30_days'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  branchId: z.string().optional(),
  paymentMethod: z.string().optional(),
  status: z.string().optional(),
  timezone: z.string().default('Asia/Kolkata'),
});

export type ReportPreviewInput = z.infer<typeof reportPreviewSchema>;

export const reportExportSchema = reportPreviewSchema.extend({
  format: z.enum(['csv', 'xlsx', 'pdf']).default('csv'),
});

export type ReportExportInput = z.infer<typeof reportExportSchema>;
