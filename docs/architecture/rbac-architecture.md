# X10Think - RBAC & Permission Management Architecture

## 1. Overview

This document specifies the Role-Based Access Control (RBAC) and Permission Management Architecture implemented for X10Think.
Authorization is built directly on top of the authentication layer (`requireAuth`) and enforced server-side for every protected operation.

---

## 2. Role Matrix

The system implements 7 default system roles:

| Role | Code | Description & Default Capabilities | Protected (isSystem) |
| --- | --- | --- | --- |
| **Customer** | `customer` | Access own profile, cart, reservations, orders, payments, reviews, loyalty, and menu browsing. | Yes |
| **Waiter** | `waiter` | Access assigned tables/orders, reservations, create/update permitted orders, and customer requests. | Yes |
| **Chef** | `chef` | Access kitchen orders display, update preparation states (accept, prepare, ready), and relevant menu data. | Yes |
| **Cashier** | `cashier` | Access orders, bills/invoices, process payments, and authorized refunds. | Yes |
| **Manager** | `manager` | Manage restaurant operations, menu/tables/reservations/orders, inventory/employees, reports, and analytics. | Yes |
| **Admin** | `admin` | Manage users, roles/permissions (where authorized), restaurant config, menu/inventory/employees, audit logs. | Yes |
| **Super Admin** | `super_admin` | Platform-wide access (`system.doEverything`), cross-tenant management, system configuration, and platform permissions. | Yes |

Custom roles can also be created dynamically by Admins and Super Admins. System roles (`isSystem: true`) are protected against renaming, deletion, or deactivation.

---

## 3. Permission Catalog

Permissions follow the granular format: `resource.action` (e.g. `orders.create`, `menu.read`, `users.delete`).

### Core Modules & Permissions:

- **Users**: `users.read`, `users.create`, `users.update`, `users.delete`, `users.me.read`, `users.me.update`
- **Roles & Permissions**: `roles.read`, `roles.manage`, `roles.assign`, `permissions.read`, `permissions.manage`
- **Menu**: `menu.read`, `menu.create`, `menu.update`, `menu.delete`
- **Orders**: `orders.read`, `orders.create`, `orders.update`, `orders.cancel`, `orders.status.update`, `orders.own.read`, `orders.own.create`, `orders.own.cancel`
- **Kitchen**: `kitchen.orders.read`, `kitchen.orders.update`
- **Reservations**: `reservations.read`, `reservations.create`, `reservations.update`, `reservations.cancel`, `reservations.own.read`, `reservations.own.create`
- **Payments**: `payments.read`, `payments.process`, `payments.refund`, `payments.own.read`
- **Inventory**: `inventory.read`, `inventory.create`, `inventory.update`
- **Reports & Analytics**: `reports.read`, `reports.export`, `analytics.read`
- **Settings & Audit Logs**: `settings.read`, `settings.update`, `audit-logs.read`
- **System Override**: `system.doEverything` (Super Admin internal capability)

---

## 4. Authorization Flow

```
HTTP Request
   │
   ▼
1. Authentication (requireAuth middleware)
   │  - Verifies JWT Access Token
   │  - Loads User record and populates active roles & permissions
   │  - Attaches req.user = { userId, sessionId, tenantId, branchIds, roles, permissions }
   ▼
2. Server-side Authorization (requirePermission / requireRole / checkResourceOwnershipAndScope)
   │  - Checks required permissions or system.doEverything
   │  - Validates resource ownership (isOwner) and branch/tenant scope
   │  - On failure: Logs audit event (UNAUTHORIZED_ACCESS_ATTEMPT) & returns HTTP 403 Forbidden
   ▼
3. Controller Handler
   │  - Validates request body with Zod schemas
   ▼
4. Business Logic Service & Data Operations
```

---

## 5. Security & Boundary Enforcement Rules

1. **Server-side Authority**: Backend authorization is ALWAYS authoritative. Frontend checks are UX-only.
2. **Anti-Self Escalation**: Users cannot assign roles to themselves, remove roles from themselves, or modify their own authorization level.
3. **Privilege Escalation Protection**: Non-super admin users cannot assign the `super_admin` role or grant permissions higher than their assigned scope.
4. **Ownership & Scope Validation**: Never trust user-supplied `role`, `permission`, `userId`, `restaurantId`, or `branchId`. Derive context from authenticated token state and verified DB records.
5. **Audit Event Logging**: All role creations, updates, deletions, permission modifications, role assignments, and 403 access violations are recorded in the `AuditLog` collection.
