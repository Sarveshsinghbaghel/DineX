import assert from 'node:assert/strict';
import { test, describe, before, after } from 'node:test';
import mongoose from 'mongoose';

import { User } from '../features/auth/models/auth.models';
import { Inventory } from '../features/inventory/models/inventory.model';
import { Employee } from '../features/employees/models/employee.model';
import { ReportHistory } from '../features/reports/models/report-history.model';

import * as analyticsService from '../features/analytics/services/analytics.service';
import * as reportService from '../features/reports/services/report.service';
import {
  resolveDateRange,
  calculatePercentageChange,
} from '../features/analytics/services/timezone-date.utils';
import { generateCSVReport } from '../features/reports/services/export-generators';
import {
  analyticsQuerySchema,
  reportPreviewSchema,
  reportExportSchema,
} from '@x10think/validation';

import type { UserAuthContext } from '../middlewares/authorization.middleware';
import type { ReportPreviewResult } from '@x10think/types';

describe('DineX Combined Phases 17–18 Test Suite', () => {
  const tenantId = 'tenant_test_17_18';
  const branchId = new mongoose.Types.ObjectId().toString();
  const userId = new mongoose.Types.ObjectId().toString();

  const mockAdminActor: UserAuthContext = {
    userId,
    sessionId: 'sess_admin_17',
    tenantId,
    roles: [{ _id: 'r1', name: 'Admin', code: 'admin', isSystem: true }],
    permissions: ['analytics.read', 'reports.read', 'reports.export'],
  };

  const mockManagerActor: UserAuthContext = {
    userId: new mongoose.Types.ObjectId().toString(),
    sessionId: 'sess_mgr_17',
    tenantId,
    branchIds: [branchId],
    roles: [{ _id: 'r2', name: 'Manager', code: 'manager', isSystem: true }],
    permissions: ['analytics.read', 'reports.read', 'reports.export'],
  };

  before(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dinex-test');
    }

    await User.deleteMany({ tenantId });
    await Inventory.deleteMany({ tenantId });
    await Employee.deleteMany({ tenantId });
    await ReportHistory.deleteMany({ tenantId });

    await User.create({
      _id: new mongoose.Types.ObjectId(userId),
      tenantId,
      name: 'Admin Analytics',
      email: `admin_analytics_${Date.now()}@dinex.test`,
      passwordHash: 'hash',
      emailVerified: true,
      accountStatus: 'active',
      roleIds: [new mongoose.Types.ObjectId()],
    });

    await Inventory.create({
      tenantId,
      branchId: new mongoose.Types.ObjectId(branchId),
      ingredientId: new mongoose.Types.ObjectId(),
      currentQuantity: 10,
      reorderLevel: 20,
      unit: 'kg',
      status: 'active',
      stockState: 'LOW',
    });
  });

  after(async () => {
    await User.deleteMany({ tenantId });
    await Inventory.deleteMany({ tenantId });
    await Employee.deleteMany({ tenantId });
    await ReportHistory.deleteMany({ tenantId });

    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });

  // PHASE 17 — ANALYTICS TESTS
  describe('Phase 17: Analytics & Business Intelligence', () => {
    test('1. Timezone date range resolution and percentage change calculation', () => {
      const range = resolveDateRange('last_7_days', 'Asia/Kolkata');
      assert.ok(range.startDate);
      assert.ok(range.endDate);
      assert.equal(range.label, 'Last 7 Days');

      const pctUp = calculatePercentageChange(150, 100);
      assert.equal(pctUp, 50);

      const pctZeroPrev = calculatePercentageChange(100, 0);
      assert.equal(pctZeroPrev, 100);
    });

    test('2. Dashboard KPI summary calculation & low stock integration', async () => {
      const query = analyticsQuerySchema.parse({ period: 'last_30_days', branchId });
      const summary = await analyticsService.getDashboardSummary(mockAdminActor, query);

      assert.ok(summary);
      assert.equal(summary.lowStockItemsCount, 1);
      assert.equal(typeof summary.grossRevenue, 'number');
      assert.equal(typeof summary.netRevenue, 'number');
    });

    test('3. Revenue, Order, Menu, Inventory & Customer Analytics endpoints', async () => {
      const query = analyticsQuerySchema.parse({ period: 'this_month' });

      const rev = await analyticsService.getRevenueAnalytics(mockAdminActor, query);
      assert.ok(rev.breakdownByChannel.length > 0);

      const menu = await analyticsService.getMenuAnalytics(mockAdminActor, query);
      assert.ok(menu.topSellingItems.length > 0);

      const inv = await analyticsService.getInventoryAnalytics(mockAdminActor, query);
      assert.equal(inv.lowStockItemsCount, 1);

      const cust = await analyticsService.getCustomerAnalytics(mockAdminActor, query);
      assert.ok(cust.totalCustomers >= 1);
    });

    test('4. Manager branch boundary scope enforcement', async () => {
      const foreignBranchId = new mongoose.Types.ObjectId().toString();
      const query = analyticsQuerySchema.parse({ branchId: foreignBranchId });

      await assert.rejects(
        async () => analyticsService.getDashboardSummary(mockManagerActor, query),
        {
          name: 'AppError',
          message: 'Access denied: branch scope violation.',
        },
      );
    });
  });

  // PHASE 18 — REPORTS & EXPORT TESTS
  describe('Phase 18: Reports & Data Export', () => {
    test('1. Preview Tax / GST Compliance Report', async () => {
      const query = reportPreviewSchema.parse({ reportType: 'taxes', period: 'last_30_days' });
      const preview = await reportService.previewReport(query, mockAdminActor);

      assert.equal(preview.reportType, 'taxes');
      assert.equal(preview.title, 'Tax / GST Compliance Report');
      assert.ok(preview.columns.length > 0);
      assert.ok(preview.rows.length > 0);
    });

    test('2. Formula Injection Protection in CSV Generator', () => {
      const mockPreview: ReportPreviewResult = {
        reportType: 'sales',
        title: 'Formula Test',
        generatedAt: new Date().toISOString(),
        tenantId,
        timezone: 'Asia/Kolkata',
        dateRange: { startDate: '2026-09-01', endDate: '2026-09-02' },
        summary: {},
        columns: [
          { key: 'col1', label: 'Col 1' },
          { key: 'col2', label: 'Col 2' },
        ],
        rows: [
          { col1: '=SUM(A1:A10)', col2: '+12345' },
          { col1: '-DANGEROUS', col2: '@MALICIOUS' },
        ],
        totalRows: 2,
      };

      const csv = generateCSVReport(mockPreview);
      assert.ok(csv.includes("'=SUM(A1:A10)"));
      assert.ok(csv.includes("'+12345"));
      assert.ok(csv.includes("'-DANGEROUS"));
      assert.ok(csv.includes("'@MALICIOUS"));
    });

    test('3. CSV, XLSX, and PDF report exports and history tracking', async () => {
      const exportCsvQuery = reportExportSchema.parse({ reportType: 'taxes', format: 'csv' });
      const resCsv = await reportService.exportReport(exportCsvQuery, mockAdminActor);
      assert.equal(resCsv.contentType, 'text/csv');
      assert.ok(resCsv.buffer);

      const exportXlsxQuery = reportExportSchema.parse({ reportType: 'sales', format: 'xlsx' });
      const resXlsx = await reportService.exportReport(exportXlsxQuery, mockAdminActor);
      assert.equal(
        resXlsx.contentType,
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      assert.ok(Buffer.isBuffer(resXlsx.buffer));

      const exportPdfQuery = reportExportSchema.parse({ reportType: 'inventory', format: 'pdf' });
      const resPdf = await reportService.exportReport(exportPdfQuery, mockAdminActor);
      assert.equal(resPdf.contentType, 'application/pdf');
      assert.ok(Buffer.isBuffer(resPdf.buffer));

      const history = await reportService.listReportHistory(mockAdminActor);
      assert.ok(history.length >= 3);
    });
  });
});
