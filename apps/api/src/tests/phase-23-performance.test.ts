import assert from 'node:assert/strict';
import { test, describe, before, after } from 'node:test';
import mongoose from 'mongoose';

import { Order } from '../features/orders/models/order.model';
import { AuditLog } from '../features/audit-logs/models/audit-log.model';
import { uploadAvatarToCloudinary } from '../lib/cloudinary.service';
import * as analyticsService from '../features/analytics/services/analytics.service';
import type { UserAuthContext } from '../middlewares/authorization.middleware';

describe('DineX Phase 23: Performance Optimization & Scalability Benchmark Suite', () => {
  const tenantId = 'tenant_perf_23';
  const branchId = new mongoose.Types.ObjectId();
  const userId = new mongoose.Types.ObjectId();

  const mockAdminActor: UserAuthContext = {
    userId: userId.toString(),
    sessionId: 'sess_perf_23',
    tenantId,
    branchIds: [branchId.toString()],
    roles: [{ _id: 'r_admin', name: 'Admin', code: 'admin', isSystem: true }],
    permissions: ['analytics.read'],
  };

  before(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dinex-test');
    }

    await Order.deleteMany({ tenantId });
    await AuditLog.deleteMany({ tenantId });

    // Seed batch orders for performance benchmarking
    const batchOrders = Array.from({ length: 50 }, (_, i) => ({
      tenantId,
      branchId,
      orderNumber: `PERF-ORD-${i + 1}`,
      source: 'qr',
      serviceMode: 'dine_in',
      items: [{ menuItemId: 'ITEM-101', itemName: 'Butter Chicken', quantity: 1, unitPrice: 400, totalPrice: 400 }],
      subtotal: 400,
      taxAmount: 20,
      discountAmount: 0,
      deliveryFee: 0,
      grandTotal: 420,
      status: i % 2 === 0 ? 'completed' : 'placed',
      paymentStatus: 'paid',
      createdAt: new Date(Date.now() - i * 60000),
    }));

    await Order.insertMany(batchOrders);

    // Seed batch audit logs
    const batchAuditLogs = Array.from({ length: 50 }, (_, i) => ({
      tenantId,
      actorId: userId,
      action: 'PERF_BENCHMARK_ACTION',
      targetType: 'order',
      targetId: `PERF-ORD-${i + 1}`,
      timestamp: new Date(Date.now() - i * 60000),
    }));

    await AuditLog.insertMany(batchAuditLogs);
  });

  after(async () => {
    await Order.deleteMany({ tenantId });
    await AuditLog.deleteMany({ tenantId });

    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });

  test('1. Compound Index Query Performance: Order query executes in < 50ms', async () => {
    const startTime = performance.now();

    const orders = await Order.find({ tenantId, branchId, status: 'completed' })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    const durationMs = performance.now() - startTime;

    assert.ok(orders.length > 0);
    assert.ok(durationMs < 50, `Expected query duration < 50ms, got ${durationMs.toFixed(2)}ms`);
  });

  test('2. Parallel Analytics Execution: Dashboard summary executes in < 50ms', async () => {
    const startTime = performance.now();

    const summary = await analyticsService.getDashboardSummary(mockAdminActor, {
      period: 'last_7_days',
      timezone: 'Asia/Kolkata',
      branchId: branchId.toString(),
    });

    const durationMs = performance.now() - startTime;

    assert.ok(summary);
    assert.ok(durationMs < 50, `Expected analytics duration < 50ms, got ${durationMs.toFixed(2)}ms`);
  });

  test('3. Audit Log Compound Index Query: Audit search executes in < 50ms', async () => {
    const startTime = performance.now();

    const logs = await AuditLog.find({ tenantId, action: 'PERF_BENCHMARK_ACTION' })
      .sort({ timestamp: -1 })
      .limit(20)
      .lean();

    const durationMs = performance.now() - startTime;

    assert.ok(logs.length > 0);
    assert.ok(durationMs < 50, `Expected audit log query duration < 50ms, got ${durationMs.toFixed(2)}ms`);
  });

  test('4. Cloudinary Auto-Compression Optimization: URL contains f_auto,q_auto flags', async () => {
    const validPngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const asset = await uploadAvatarToCloudinary(userId.toString(), validPngBuffer, 'image/png');

    assert.ok(asset.url.includes('f_auto,q_auto,w_400,h_400,c_limit'));
  });
});
