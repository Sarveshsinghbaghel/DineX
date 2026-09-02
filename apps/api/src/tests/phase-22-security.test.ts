import assert from 'node:assert/strict';
import { test, describe, before, after } from 'node:test';
import mongoose from 'mongoose';

import { User, Session } from '../features/auth/models/auth.models';
import { Branch } from '../features/branches/models/branch.model';
import { Restaurant } from '../features/restaurants/models/restaurant.model';
import * as authService from '../features/auth/services/auth.service';
import { requireAuth, checkResourceOwnershipAndScope, type UserAuthContext } from '../middlewares/authorization.middleware';
import { validateImageBuffer } from '../lib/cloudinary.service';
import { generateCSVReport, generateXLSXReport } from '../features/reports/services/export-generators';
import { nosqlSanitizeMiddleware } from '../middlewares/nosql-sanitize.middleware';
import type { Request, Response } from 'express';

describe('DineX Phase 22: Security Hardening & Production Security Audit Suite', () => {
  const tenantId = 'tenant_sec_22';
  const restaurantId = new mongoose.Types.ObjectId();
  const branchAId = new mongoose.Types.ObjectId();
  const branchBId = new mongoose.Types.ObjectId();
  const testUserId = new mongoose.Types.ObjectId();

  before(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dinex-test');
    }

    await User.deleteMany({ tenantId });
    await Session.deleteMany({ userId: testUserId });
    await Branch.deleteMany({ tenantId });
    await Restaurant.deleteMany({ tenantId });

    await Restaurant.create({
      _id: restaurantId,
      tenantId,
      name: 'DineX Security Kitchen',
      legalName: 'DineX Sec Foods Ltd',
      email: 'sec@dinex.app',
      phone: '+919876543210',
      address: {
        label: 'Main',
        recipientName: 'Admin',
        phone: '+919876543210',
        addressLine1: 'Security Way',
        city: 'Delhi',
        state: 'Delhi',
        postalCode: '110001',
        country: 'India',
      },
      cuisineTypes: ['North Indian'],
      status: 'ACTIVE',
      currency: 'INR',
      timezone: 'Asia/Kolkata',
    });

    await Branch.create({
      _id: branchAId,
      tenantId,
      restaurantId,
      name: 'Branch A',
      code: 'SEC-A01',
      phone: '+919876543210',
      address: {
        label: 'Branch A',
        recipientName: 'Mgr A',
        phone: '+919876543210',
        addressLine1: 'Address A',
        city: 'Delhi',
        state: 'Delhi',
        postalCode: '110001',
        country: 'India',
      },
      timezone: 'Asia/Kolkata',
      status: 'ACTIVE',
    });

    await Branch.create({
      _id: branchBId,
      tenantId,
      restaurantId,
      name: 'Branch B',
      code: 'SEC-B01',
      phone: '+919876543210',
      address: {
        label: 'Branch B',
        recipientName: 'Mgr B',
        phone: '+919876543210',
        addressLine1: 'Address B',
        city: 'Delhi',
        state: 'Delhi',
        postalCode: '110001',
        country: 'India',
      },
      timezone: 'Asia/Kolkata',
      status: 'ACTIVE',
    });

    await User.create({
      _id: testUserId,
      tenantId,
      name: 'Security User',
      email: 'secuser@dinex.app',
      passwordHash: 'hashed_password_123',
      phone: '+919811122233',
      accountStatus: 'active',
      emailVerified: true,
    });
  });

  after(async () => {
    await User.deleteMany({ tenantId });
    await Session.deleteMany({ userId: testUserId });
    await Branch.deleteMany({ tenantId });
    await Restaurant.deleteMany({ tenantId });

    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });

  test('1. Session Revocation: Logged-out session token is rejected', async () => {
    const fakeReq = { ip: '127.0.0.1', get: () => 'TestAgent' } as unknown as Request;
    const authSession = await authService.createLoginSession(testUserId.toString(), fakeReq);

    assert.ok(authSession.accessToken);
    assert.ok(authSession.session.id);

    // Logout revokes session
    await authService.logout(authSession.session.id);

    // requireAuth middleware check for revoked session
    const mockRequest = {
      get: (headerName: string) => (headerName.toLowerCase() === 'authorization' ? `Bearer ${authSession.accessToken}` : null),
    } as unknown as Request;

    const mockResponse = {} as Response;

    let authError: any = null;
    await requireAuth(mockRequest, mockResponse, (err) => {
      authError = err;
    });

    assert.ok(authError);
    assert.equal(authError.message, 'Session revoked or expired.');
    assert.equal(authError.code, 'AUTH_SESSION_REVOKED');
  });

  test('2. Refresh Token Reuse: Reusing an old refresh token invalidates session', async () => {
    const fakeReq = { ip: '127.0.0.1', get: () => 'TestAgent' } as unknown as Request;
    const session1 = await authService.createLoginSession(testUserId.toString(), fakeReq);

    // First refresh -> succeeds and rotates token
    const refreshed = await authService.refresh(session1.refreshToken);
    assert.ok(refreshed.accessToken);

    // Attempting to reuse old refresh token -> triggers reuse detection & revokes session
    let reuseError: any = null;
    try {
      await authService.refresh(session1.refreshToken);
    } catch (err) {
      reuseError = err;
    }

    assert.ok(reuseError);
    assert.equal(reuseError.code, 'AUTH_REFRESH_REUSED');

    // Verify session in database is marked revokedAt
    const dbSession = await Session.findById(session1.session.id);
    assert.ok(dbSession?.revokedAt);
  });

  test('3. NoSQL Operator Injection: Middleware strips dangerous $ operators', () => {
    const maliciousBody = {
      email: { $ne: null },
      password: { $gt: '' },
      validField: 'safe_value',
      nested: {
        $where: 'this.admin === true',
        safeNested: 123,
      },
    };

    const req = { body: maliciousBody, query: { $ne: '1' }, params: { id: '123' } } as unknown as Request;
    nosqlSanitizeMiddleware(req, {} as Response, () => {});

    assert.deepEqual(req.body.email, {});
    assert.deepEqual(req.body.password, {});
    assert.equal(req.body.validField, 'safe_value');
    assert.equal(req.body.nested.$where, undefined);
    assert.equal(req.body.nested.safeNested, 123);
    assert.deepEqual(req.query, {});
  });

  test('4. RBAC & Cross-Branch Authorization Boundary Isolation', () => {
    const mgrActor: UserAuthContext = {
      userId: testUserId.toString(),
      sessionId: 'sess_mgr',
      tenantId,
      branchIds: [branchAId.toString()],
      roles: [{ _id: 'r_mgr', name: 'Manager', code: 'manager', isSystem: true }],
      permissions: ['orders.read'],
    };

    // Access resource in Branch A -> Allowed
    const canAccessA = checkResourceOwnershipAndScope(mgrActor, {
      tenantId,
      branchId: branchAId.toString(),
    });
    assert.equal(canAccessA, true);

    // Access resource in Branch B -> Denied
    const canAccessB = checkResourceOwnershipAndScope(mgrActor, {
      tenantId,
      branchId: branchBId.toString(),
    });
    assert.equal(canAccessB, false);

    // Cross-tenant resource access -> Denied
    const canAccessOtherTenant = checkResourceOwnershipAndScope(mgrActor, {
      tenantId: 'other_tenant_id',
      branchId: branchAId.toString(),
    });
    assert.equal(canAccessOtherTenant, false);
  });

  test('5. File Upload Magic Byte Validation & Executable Rejection', () => {
    // Valid PNG signature: [0x89, 0x50, 0x4E, 0x47]
    const validPngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const validated = validateImageBuffer(validPngBuffer, 'image/png');
    assert.equal(validated.format, 'png');

    // Executable ELF / Script disguised as image -> Must be rejected
    const maliciousBuffer = Buffer.from([0x7f, 0x45, 0x4c, 0x46, 0x01, 0x01, 0x01, 0x00]);
    assert.throws(
      () => validateImageBuffer(maliciousBuffer, 'image/png'),
      {
        name: 'AppError',
        message: 'File signature validation failed. File is not a valid image.',
      },
    );
  });

  test('6. CSV & XLSX Spreadsheet Formula Injection Sanitization', async () => {
    const reportData = {
      reportType: 'sales' as const,
      tenantId,
      title: 'Security Test Report',
      generatedAt: new Date().toISOString(),
      timezone: 'Asia/Kolkata',
      dateRange: { startDate: '2026-09-01', endDate: '2026-09-02' },
      columns: [
        { key: 'name', label: 'Item Name', type: 'string' as const },
        { key: 'notes', label: 'Notes', type: 'string' as const },
      ],
      rows: [
        { name: '=CMD|"/C calc"!A0', notes: '+12345' },
        { name: '-SUM(1,2)', notes: '@script' },
      ],
      summary: {},
      totalRows: 2,
    };

    const csvOutput = generateCSVReport(reportData);
    assert.ok(csvOutput.includes("'=CMD"));
    assert.ok(csvOutput.includes("'+12345"));
    assert.ok(csvOutput.includes("'-SUM"));

    const xlsxBuffer = await generateXLSXReport(reportData);
    assert.ok(xlsxBuffer.length > 0);
  });
});
