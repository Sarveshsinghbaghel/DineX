export const SYSTEM_ROLES = {
  CUSTOMER: 'customer',
  WAITER: 'waiter',
  CHEF: 'chef',
  CASHIER: 'cashier',
  MANAGER: 'manager',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin',
} as const;

export type SystemRoleCode = (typeof SYSTEM_ROLES)[keyof typeof SYSTEM_ROLES];

export interface PermissionDefinition {
  code: string;
  module: string;
  action: string;
  scope: 'own' | 'branch' | 'restaurant' | 'tenant' | 'platform';
  description: string;
}

export const PERMISSION_CATALOG: PermissionDefinition[] = [
  // User Management
  { code: 'users.read', module: 'users', action: 'read', scope: 'tenant', description: 'Read user profiles' },
  { code: 'users.create', module: 'users', action: 'create', scope: 'tenant', description: 'Create new user accounts' },
  { code: 'users.update', module: 'users', action: 'update', scope: 'tenant', description: 'Update user accounts' },
  { code: 'users.delete', module: 'users', action: 'delete', scope: 'tenant', description: 'Delete or deactivate user accounts' },
  { code: 'users.me.read', module: 'users', action: 'me.read', scope: 'own', description: 'Read own profile' },
  { code: 'users.me.update', module: 'users', action: 'me.update', scope: 'own', description: 'Update own profile' },

  // Role & Permission Management
  { code: 'roles.read', module: 'roles', action: 'read', scope: 'tenant', description: 'Read roles and permissions' },
  { code: 'roles.manage', module: 'roles', action: 'manage', scope: 'tenant', description: 'Create, update, and delete custom roles' },
  { code: 'roles.assign', module: 'roles', action: 'assign', scope: 'tenant', description: 'Assign roles to users' },
  { code: 'permissions.read', module: 'permissions', action: 'read', scope: 'tenant', description: 'Read permissions catalog' },
  { code: 'permissions.manage', module: 'permissions', action: 'manage', scope: 'platform', description: 'Manage permissions catalog' },

  // Menu Management
  { code: 'menu.read', module: 'menu', action: 'read', scope: 'tenant', description: 'Browse and search menu items' },
  { code: 'menu.create', module: 'menu', action: 'create', scope: 'restaurant', description: 'Create menu items' },
  { code: 'menu.update', module: 'menu', action: 'update', scope: 'restaurant', description: 'Update menu items and availability' },
  { code: 'menu.delete', module: 'menu', action: 'delete', scope: 'restaurant', description: 'Delete menu items' },

  // Orders Management
  { code: 'orders.read', module: 'orders', action: 'read', scope: 'branch', description: 'Read orders' },
  { code: 'orders.create', module: 'orders', action: 'create', scope: 'branch', description: 'Create new orders' },
  { code: 'orders.update', module: 'orders', action: 'update', scope: 'branch', description: 'Update existing orders' },
  { code: 'orders.cancel', module: 'orders', action: 'cancel', scope: 'branch', description: 'Cancel orders' },
  { code: 'orders.status.update', module: 'orders', action: 'status.update', scope: 'branch', description: 'Update order status' },
  { code: 'orders.own.read', module: 'orders', action: 'own.read', scope: 'own', description: 'Read own orders' },
  { code: 'orders.own.create', module: 'orders', action: 'own.create', scope: 'own', description: 'Create own orders' },
  { code: 'orders.own.cancel', module: 'orders', action: 'own.cancel', scope: 'own', description: 'Cancel own orders' },

  // Kitchen Operations
  { code: 'kitchen.orders.read', module: 'kitchen', action: 'orders.read', scope: 'branch', description: 'Read kitchen display order queue' },
  { code: 'kitchen.orders.update', module: 'kitchen', action: 'orders.update', scope: 'branch', description: 'Update kitchen order state (accept, prepare, ready)' },

  // Reservations
  { code: 'reservations.read', module: 'reservations', action: 'read', scope: 'branch', description: 'Read table reservations' },
  { code: 'reservations.create', module: 'reservations', action: 'create', scope: 'branch', description: 'Create table reservations' },
  { code: 'reservations.update', module: 'reservations', action: 'update', scope: 'branch', description: 'Update table reservations' },
  { code: 'reservations.cancel', module: 'reservations', action: 'cancel', scope: 'branch', description: 'Cancel table reservations' },
  { code: 'reservations.own.read', module: 'reservations', action: 'own.read', scope: 'own', description: 'Read own reservations' },
  { code: 'reservations.own.create', module: 'reservations', action: 'own.create', scope: 'own', description: 'Create own reservations' },

  // Payments & Cashiering
  { code: 'payments.read', module: 'payments', action: 'read', scope: 'branch', description: 'Read payment records' },
  { code: 'payments.process', module: 'payments', action: 'process', scope: 'branch', description: 'Process payments and generate bills' },
  { code: 'payments.refund', module: 'payments', action: 'refund', scope: 'branch', description: 'Issue payment refunds' },
  { code: 'payments.own.read', module: 'payments', action: 'own.read', scope: 'own', description: 'Read own payment receipts' },

  // Inventory Management
  { code: 'inventory.read', module: 'inventory', action: 'read', scope: 'restaurant', description: 'Read inventory levels and ingredients' },
  { code: 'inventory.create', module: 'inventory', action: 'create', scope: 'restaurant', description: 'Create inventory items' },
  { code: 'inventory.update', module: 'inventory', action: 'update', scope: 'restaurant', description: 'Update inventory stock levels' },

  // Reports & Analytics
  { code: 'reports.read', module: 'reports', action: 'read', scope: 'restaurant', description: 'View operational reports' },
  { code: 'reports.export', module: 'reports', action: 'export', scope: 'restaurant', description: 'Export operational reports' },
  { code: 'analytics.read', module: 'analytics', action: 'read', scope: 'restaurant', description: 'View analytics dashboards' },

  // Settings & System Configuration
  { code: 'settings.read', module: 'settings', action: 'read', scope: 'restaurant', description: 'Read restaurant and branch settings' },
  { code: 'settings.update', module: 'settings', action: 'update', scope: 'restaurant', description: 'Update settings' },
  { code: 'audit-logs.read', module: 'audit-logs', action: 'read', scope: 'tenant', description: 'View system audit logs' },

  // Super Admin internal wildcard / system override
  { code: 'system.doEverything', module: 'system', action: 'doEverything', scope: 'platform', description: 'Platform super admin full access' },
];

export const DEFAULT_ROLE_PERMISSIONS: Record<SystemRoleCode, string[]> = {
  [SYSTEM_ROLES.CUSTOMER]: [
    'users.me.read',
    'users.me.update',
    'menu.read',
    'orders.own.read',
    'orders.own.create',
    'orders.own.cancel',
    'reservations.own.read',
    'reservations.own.create',
    'payments.own.read',
  ],

  [SYSTEM_ROLES.WAITER]: [
    'users.me.read',
    'users.me.update',
    'menu.read',
    'orders.read',
    'orders.create',
    'orders.update',
    'orders.status.update',
    'reservations.read',
    'reservations.create',
    'reservations.update',
  ],

  [SYSTEM_ROLES.CHEF]: [
    'users.me.read',
    'users.me.update',
    'menu.read',
    'kitchen.orders.read',
    'kitchen.orders.update',
  ],

  [SYSTEM_ROLES.CASHIER]: [
    'users.me.read',
    'users.me.update',
    'menu.read',
    'orders.read',
    'orders.update',
    'payments.read',
    'payments.process',
    'payments.refund',
  ],

  [SYSTEM_ROLES.MANAGER]: [
    'users.me.read',
    'users.me.update',
    'users.read',
    'menu.read',
    'menu.create',
    'menu.update',
    'orders.read',
    'orders.create',
    'orders.update',
    'orders.cancel',
    'orders.status.update',
    'reservations.read',
    'reservations.create',
    'reservations.update',
    'reservations.cancel',
    'payments.read',
    'payments.process',
    'payments.refund',
    'inventory.read',
    'inventory.create',
    'inventory.update',
    'reports.read',
    'reports.export',
    'analytics.read',
    'settings.read',
  ],

  [SYSTEM_ROLES.ADMIN]: [
    'users.me.read',
    'users.me.update',
    'users.read',
    'users.create',
    'users.update',
    'users.delete',
    'roles.read',
    'roles.manage',
    'roles.assign',
    'permissions.read',
    'menu.read',
    'menu.create',
    'menu.update',
    'menu.delete',
    'orders.read',
    'orders.create',
    'orders.update',
    'orders.cancel',
    'orders.status.update',
    'reservations.read',
    'reservations.create',
    'reservations.update',
    'reservations.cancel',
    'payments.read',
    'payments.process',
    'payments.refund',
    'inventory.read',
    'inventory.create',
    'inventory.update',
    'reports.read',
    'reports.export',
    'analytics.read',
    'settings.read',
    'settings.update',
    'audit-logs.read',
  ],

  [SYSTEM_ROLES.SUPER_ADMIN]: [
    'system.doEverything',
    ...PERMISSION_CATALOG.map((p) => p.code),
  ],
};
