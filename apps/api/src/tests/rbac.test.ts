import test from 'node:test';
import assert from 'node:assert/strict';
import { SYSTEM_ROLES, PERMISSION_CATALOG, DEFAULT_ROLE_PERMISSIONS } from '@x10think/constants';
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  isOwner,
  checkResourceOwnershipAndScope,
  type UserAuthContext,
} from '../middlewares/authorization.middleware';

test('RBAC System Roles & Default Permissions', () => {
  // Verify permission catalog exists
  assert.ok(PERMISSION_CATALOG.length > 20);

  // Test 1: Verify all 7 roles exist

  const roles = Object.values(SYSTEM_ROLES);
  assert.equal(roles.length, 7);
  assert.deepEqual(roles, ['customer', 'waiter', 'chef', 'cashier', 'manager', 'admin', 'super_admin']);

  // Test 2: Check Customer permissions
  const customerPerms = DEFAULT_ROLE_PERMISSIONS.customer;
  assert.ok(customerPerms.includes('orders.own.read'));
  assert.ok(customerPerms.includes('menu.read'));
  assert.ok(!customerPerms.includes('users.delete'));

  // Test 3: Check Waiter permissions
  const waiterPerms = DEFAULT_ROLE_PERMISSIONS.waiter;
  assert.ok(waiterPerms.includes('orders.create'));
  assert.ok(waiterPerms.includes('orders.status.update'));
  assert.ok(!waiterPerms.includes('payments.refund'));

  // Test 4: Check Chef permissions
  const chefPerms = DEFAULT_ROLE_PERMISSIONS.chef;
  assert.ok(chefPerms.includes('kitchen.orders.read'));
  assert.ok(chefPerms.includes('kitchen.orders.update'));
  assert.ok(!chefPerms.includes('users.create'));

  // Test 5: Check Cashier permissions
  const cashierPerms = DEFAULT_ROLE_PERMISSIONS.cashier;
  assert.ok(cashierPerms.includes('payments.process'));
  assert.ok(cashierPerms.includes('payments.refund'));

  // Test 6: Check Manager permissions
  const managerPerms = DEFAULT_ROLE_PERMISSIONS.manager;
  assert.ok(managerPerms.includes('menu.create'));
  assert.ok(managerPerms.includes('inventory.update'));
  assert.ok(managerPerms.includes('reports.read'));

  // Test 7: Check Admin permissions
  const adminPerms = DEFAULT_ROLE_PERMISSIONS.admin;
  assert.ok(adminPerms.includes('roles.manage'));
  assert.ok(adminPerms.includes('users.delete'));

  // Test 8: Check Super Admin permissions
  const superAdminPerms = DEFAULT_ROLE_PERMISSIONS.super_admin;
  assert.ok(superAdminPerms.includes('system.doEverything'));
});

test('Authorization Middleware Helper Functions', () => {
  const customerContext: UserAuthContext = {
    userId: 'user_123',
    sessionId: 'session_456',
    tenantId: 'tenant_789',
    roles: [{ _id: 'role_1', code: 'customer', name: 'Customer', isSystem: true }],
    permissions: DEFAULT_ROLE_PERMISSIONS.customer,
  };

  const superAdminContext: UserAuthContext = {
    userId: 'admin_999',
    sessionId: 'session_999',
    tenantId: 'tenant_789',
    roles: [{ _id: 'role_super', code: 'super_admin', name: 'Super Admin', isSystem: true }],
    permissions: ['system.doEverything'],
  };

  // Test hasPermission
  assert.equal(hasPermission(customerContext, 'menu.read'), true);
  assert.equal(hasPermission(customerContext, 'users.delete'), false);
  assert.equal(hasPermission(superAdminContext, 'users.delete'), true);

  // Test hasAnyPermission
  assert.equal(hasAnyPermission(customerContext, ['users.delete', 'menu.read']), true);
  assert.equal(hasAnyPermission(customerContext, ['users.delete', 'roles.manage']), false);

  // Test hasAllPermissions
  assert.equal(hasAllPermissions(customerContext, ['menu.read', 'orders.own.read']), true);
  assert.equal(hasAllPermissions(customerContext, ['menu.read', 'users.delete']), false);

  // Test isOwner
  assert.equal(isOwner(customerContext, 'user_123'), true);
  assert.equal(isOwner(customerContext, 'user_999'), false);

  // Test checkResourceOwnershipAndScope
  assert.equal(checkResourceOwnershipAndScope(customerContext, { userId: 'user_123' }), true);
  assert.equal(checkResourceOwnershipAndScope(customerContext, { userId: 'user_999' }), false);
  assert.equal(checkResourceOwnershipAndScope(superAdminContext, { userId: 'user_999' }), true);
});
