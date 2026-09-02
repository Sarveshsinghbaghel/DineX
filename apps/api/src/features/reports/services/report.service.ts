import mongoose from 'mongoose';
import { AppError } from '../../../errors/AppError';
import { ReportHistory } from '../models/report-history.model';
import * as analyticsService from '../../analytics/services/analytics.service';
import { resolveDateRange } from '../../analytics/services/timezone-date.utils';
import { generateCSVReport, generateXLSXReport, generatePDFReport } from './export-generators';
import { logAuditEvent } from '../../audit-logs/services/audit-log.service';
import type { ReportPreviewResult } from '@x10think/types';
import type { ReportPreviewInput, ReportExportInput } from '@x10think/validation';
import type { UserAuthContext } from '../../../middlewares/authorization.middleware';

function checkBranchScope(actor: UserAuthContext, branchId?: string) {
  const isSuperAdmin = actor.roles.some((r) => r.code === 'super_admin');
  if (isSuperAdmin) return;

  const isManager = actor.roles.some((r) => r.code === 'manager');
  const isAdmin = actor.roles.some((r) => r.code === 'admin');

  if (isManager && !isAdmin && branchId && actor.branchIds && actor.branchIds.length > 0) {
    if (!actor.branchIds.includes(branchId)) {
      throw new AppError('Access denied: branch scope violation.', 403, 'BRANCH_SCOPE_DENIED');
    }
  }
}

export async function previewReport(
  input: ReportPreviewInput,
  actor: UserAuthContext,
): Promise<ReportPreviewResult> {
  checkBranchScope(actor, input.branchId);

  const dateRange = resolveDateRange(input.period, input.timezone, input.startDate, input.endDate);
  const tenantId = actor.tenantId || 'tenant_default';

  let title = 'Report';
  let columns: Array<{
    key: string;
    label: string;
    type?: 'string' | 'number' | 'currency' | 'date';
  }> = [];
  let rows: Array<Record<string, unknown>> = [];
  let summary: Record<string, unknown> = {};

  switch (input.reportType) {
    case 'taxes': {
      title = 'Tax / GST Compliance Report';
      const kpis = await analyticsService.getDashboardSummary(actor, input);
      columns = [
        { key: 'category', label: 'Financial Component', type: 'string' },
        { key: 'amount', label: 'Amount (₹)', type: 'currency' },
      ];

      const gross = kpis.grossRevenue;
      const discount = kpis.discounts;
      const taxable = Math.max(0, gross - discount);
      const cgst = Math.round(taxable * 0.025 * 100) / 100;
      const sgst = Math.round(taxable * 0.025 * 100) / 100;
      const totalTax = cgst + sgst;

      rows = [
        { category: 'Gross Sales', amount: gross },
        { category: 'Discounts', amount: discount },
        { category: 'Taxable Amount', amount: taxable },
        { category: 'CGST (2.5%)', amount: cgst },
        { category: 'SGST (2.5%)', amount: sgst },
        { category: 'IGST (0%)', amount: 0 },
        { category: 'Service Charge (0%)', amount: 0 },
        { category: 'Total Tax Collected', amount: totalTax },
        { category: 'Refunds', amount: 0 },
        { category: 'Net Revenue', amount: taxable + totalTax },
      ];

      summary = { gross, taxable, totalTax, netRevenue: taxable + totalTax };
      break;
    }

    case 'sales':
    case 'revenue': {
      title = input.reportType === 'sales' ? 'Sales Overview Report' : 'Revenue Summary Report';
      const revData = await analyticsService.getRevenueAnalytics(actor, input);
      columns = [
        { key: 'metric', label: 'Metric', type: 'string' },
        { key: 'value', label: 'Value', type: 'currency' },
      ];

      rows = [
        { metric: 'Gross Revenue', value: revData.summary.grossRevenue },
        { metric: 'Discounts Applied', value: revData.summary.discounts },
        { metric: 'Net Revenue', value: revData.summary.netRevenue },
        { metric: 'Average Order Value (AOV)', value: revData.summary.averageOrderValue },
      ];
      summary = revData.summary;
      break;
    }

    case 'orders': {
      title = 'Orders Execution Report';
      const ordData = await analyticsService.getOrderAnalytics(actor, input);
      columns = [
        { key: 'status', label: 'Order Status', type: 'string' },
        { key: 'count', label: 'Total Volume', type: 'number' },
      ];
      rows = [
        { status: 'Completed Orders', count: ordData.completedOrders },
        { status: 'Cancelled Orders', count: ordData.cancelledOrders },
        { status: 'Pending Orders', count: ordData.statusBreakdown.pending },
        { status: 'Total Orders', count: ordData.totalOrders },
      ];
      summary = { totalOrders: ordData.totalOrders, aov: ordData.averageOrderValue };
      break;
    }

    case 'inventory': {
      title = 'Inventory Valuation & Low Stock Report';
      const invData = await analyticsService.getInventoryAnalytics(actor, input);
      columns = [
        { key: 'state', label: 'Stock State', type: 'string' },
        { key: 'count', label: 'Item Count', type: 'number' },
      ];
      rows = [
        { state: 'Healthy Stock', count: invData.healthyItemsCount },
        { state: 'Low Stock Threshold', count: invData.lowStockItemsCount },
        { state: 'Out of Stock', count: invData.outOfStockItemsCount },
        { state: 'Total Registered Ingredients', count: invData.totalItemsCount },
      ];
      summary = { stockValuationTotal: invData.stockValuationTotal };
      break;
    }

    case 'menu': {
      title = 'Menu Items Performance Report';
      const menuData = await analyticsService.getMenuAnalytics(actor, input);
      columns = [
        { key: 'itemName', label: 'Menu Item Name', type: 'string' },
        { key: 'quantitySold', label: 'Quantity Sold', type: 'number' },
        { key: 'totalRevenue', label: 'Total Revenue (₹)', type: 'currency' },
        { key: 'averageRating', label: 'Average Rating', type: 'number' },
      ];
      rows = menuData.topSellingItems.map((item) => ({
        itemName: item.itemName,
        quantitySold: item.quantitySold,
        totalRevenue: item.totalRevenue,
        averageRating: item.averageRating || 5.0,
      }));
      summary = { totalTopItems: menuData.topSellingItems.length };
      break;
    }

    default: {
      title = `${input.reportType.toUpperCase()} Report`;
      const dashboard = await analyticsService.getDashboardSummary(actor, input);
      columns = [
        { key: 'metric', label: 'Operational Metric', type: 'string' },
        { key: 'value', label: 'Value', type: 'number' },
      ];
      rows = [
        { metric: 'Total Orders', value: dashboard.totalOrders },
        { metric: 'Active Customers', value: dashboard.totalCustomers },
        { metric: 'Active Staff', value: dashboard.activeEmployeesCount },
      ];
      summary = dashboard;
      break;
    }
  }

  return {
    reportType: input.reportType,
    title,
    generatedAt: new Date().toISOString(),
    tenantId,
    branchId: input.branchId,
    timezone: input.timezone,
    dateRange: {
      startDate: dateRange.startDate.toISOString().slice(0, 10),
      endDate: dateRange.endDate.toISOString().slice(0, 10),
    },
    summary,
    columns,
    rows,
    totalRows: rows.length,
  };
}

export async function exportReport(input: ReportExportInput, actor: UserAuthContext) {
  const preview = await previewReport(input, actor);

  let fileBuffer: Buffer | string;
  let contentType = 'text/csv';

  if (input.format === 'xlsx') {
    fileBuffer = await generateXLSXReport(preview);
    contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  } else if (input.format === 'pdf') {
    fileBuffer = await generatePDFReport(preview);
    contentType = 'application/pdf';
  } else {
    fileBuffer = generateCSVReport(preview);
    contentType = 'text/csv';
  }

  // Audit log export action
  await logAuditEvent({
    tenantId: preview.tenantId,
    actorId: actor.userId,
    action: 'REPORT_EXPORTED',
    targetType: 'report',
    targetId: preview.reportType,
    metadata: { format: input.format, totalRows: preview.totalRows },
  });

  // Track history
  await ReportHistory.create({
    tenantId: preview.tenantId,
    branchId: input.branchId ? new mongoose.Types.ObjectId(input.branchId) : undefined,
    userId: new mongoose.Types.ObjectId(actor.userId),
    reportType: input.reportType,
    format: input.format,
    dateRangeLabel: `${preview.dateRange.startDate} to ${preview.dateRange.endDate}`,
    rowCount: preview.totalRows,
    status: 'completed',
  });

  return {
    filename: `DineX_${input.reportType}_Report.${input.format}`,
    contentType,
    buffer: fileBuffer,
  };
}

export async function listReportHistory(actor: UserAuthContext) {
  const filter: Record<string, unknown> = {};
  const isSuperAdmin = actor.roles.some((r) => r.code === 'super_admin');
  if (!isSuperAdmin && actor.tenantId) filter.tenantId = actor.tenantId;

  return ReportHistory.find(filter).sort({ generatedAt: -1 }).limit(20);
}
