# DineX Database Models & Schema Reference

This reference documents all 20 Mongoose schemas implemented in the DineX backend application. Every model enforces tenant-level isolation via `tenantId` and branch-level scope where appropriate.

---

## 1. System & Multi-Tenant Core Models

### `Restaurant`
- **Purpose**: Top-level restaurant enterprise organization entity.
- **Key Fields**: `tenantId` (indexed), `name`, `code` (unique), `currency`, `timezone`, `contactEmail`, `contactPhone`, `address`, `cuisineTypes`, `businessHours`, `status` (`ACTIVE`, `INACTIVE`, `SUSPENDED`).
- **Indexes**: `{ tenantId: 1 }`, `{ code: 1 }` (unique).

### `Branch`
- **Purpose**: Physical or cloud branch outlet associated with a Restaurant.
- **Key Fields**: `tenantId` (indexed), `restaurantId` (ref `Restaurant`), `name`, `code` (unique), `address`, `phone`, `email`, `isActive`, `serviceModes` (`dine_in`, `takeaway`, `delivery`).
- **Indexes**: `{ tenantId: 1, code: 1 }` (unique), `{ restaurantId: 1 }`.

### `User`
- **Purpose**: Authenticated system user (Customers, Staff, Managers, Admins).
- **Key Fields**: `tenantId` (indexed), `email` (unique index), `passwordHash`, `name`, `phone`, `avatarUrl`, `accountStatus` (`active`, `inactive`, `suspended`), `roles` (array of ref `Role`), `branchIds` (array of ref `Branch`), `addresses` (embedded customer addresses), `preferences`.
- **Indexes**: `{ email: 1 }` (unique), `{ tenantId: 1 }`.

### `Role`
- **Purpose**: System and custom RBAC roles.
- **Key Fields**: `tenantId` (optional), `name`, `code` (unique), `description`, `permissions` (string array of permission codes), `isSystem`.
- **Indexes**: `{ code: 1 }` (unique).

### `Setting`
- **Purpose**: Key-value settings with scope precedence (`branch` -> `restaurant` -> `system`).
- **Key Fields**: `tenantId`, `branchId`, `scope`, `key`, `value`.
- **Indexes**: `{ tenantId: 1, branchId: 1, key: 1 }`.

---

## 2. Menu, Tables & QR Ordering Models

### `Table`
- **Purpose**: Physical dining table per branch with QR code token linkage.
- **Key Fields**: `tenantId`, `branchId` (ref `Branch`), `tableNumber`, `capacity`, `section`, `qrToken` (indexed), `qrStatus` (`active`, `inactive`), `status` (`available`, `occupied`, `reserved`, `cleaning`).
- **Indexes**: `{ tenantId: 1, branchId: 1, tableNumber: 1 }` (unique), `{ qrToken: 1 }` (unique).

### `Order`
- **Purpose**: Master order record spanning Dine-In, QR, Takeaway, and Delivery.
- **Key Fields**: `tenantId` (indexed), `branchId` (ref `Branch`), `tableId` (ref `Table`), `orderNumber` (unique index), `source` (`qr`, `waiter`, `pos`, `online`), `serviceMode` (`dine_in`, `takeaway`, `delivery`), `customerId` (ref `User`), `guestName`, `guestPhone`, `items` (array of `OrderItemSchema`), `subtotal`, `taxAmount`, `discountAmount`, `deliveryFee`, `grandTotal`, `status` (`placed`, `confirmed`, `preparing`, `ready`, `served`, `completed`, `cancelled`, `assigned`, `out_for_delivery`, `delivered`), `paymentStatus` (`pending`, `paid`, `refunded`), `paymentMethod` (`online`, `cod`, `card`, `cash`), `deliveryAddress`, `assignedEmployeeId` (ref `Employee`).
- **Indexes**: `{ tenantId: 1, branchId: 1, status: 1, createdAt: -1 }`, `{ tenantId: 1, serviceMode: 1, status: 1 }`, `{ tenantId: 1, createdAt: -1 }`, `{ assignedEmployeeId: 1, status: 1 }`.

---

## 3. Inventory & Procurement Models

### `Ingredient`
- **Purpose**: Master raw item catalog for inventory tracking.
- **Key Fields**: `tenantId`, `name`, `code`, `category`, `unit` (`g`, `kg`, `ml`, `l`, `unit`, `pack`), `costPerUnit`.

### `Inventory`
- **Purpose**: Stock level tracking per ingredient per branch.
- **Key Fields**: `tenantId`, `branchId` (ref `Branch`), `ingredientId` (ref `Ingredient`), `currentQuantity`, `reservedQuantity`, `reorderLevel`, `unit`, `averageUnitCost`, `status` (`active`, `out_of_stock`, `inactive`).
- **Indexes**: `{ tenantId: 1, branchId: 1, ingredientId: 1 }` (unique), `{ tenantId: 1, branchId: 1, status: 1, currentQuantity: 1 }`.

### `StockTransaction`
- **Purpose**: Audit log of inventory quantity changes (`inbound`, `outbound`, `adjustment`, `waste`).
- **Key Fields**: `tenantId`, `branchId`, `ingredientId`, `type`, `quantityChange`, `previousQuantity`, `newQuantity`, `reason`, `performedBy`.

### `Supplier`
- **Purpose**: Vendor entity for inventory procurement.
- **Key Fields**: `tenantId`, `name`, `code`, `contactName`, `email`, `phone`, `address`, `taxId`.

### `PurchaseOrder`
- **Purpose**: Procurement orders sent to suppliers.
- **Key Fields**: `tenantId`, `branchId`, `supplierId`, `poNumber`, `items`, `grandTotal`, `status` (`draft`, `ordered`, `received`, `cancelled`), `orderedAt`, `receivedAt`.

---

## 4. Employee & Attendance Models

### `Employee`
- **Purpose**: Staff member operational profile.
- **Key Fields**: `tenantId`, `userId` (ref `User`), `employeeNumber` (unique), `employmentStatus` (`active`, `inactive`, `terminated`), `employmentType`, `primaryBranchId` (ref `Branch`), `branchIds`, `jobTitle`.

---

## 5. Engagement & Analytics Models

### `Favorite` / `Loyalty` / `Rating` / `Review`
- **Purpose**: Customer feedback, favorite menu items, and loyalty points accumulation.

### `Notification`
- **Purpose**: User and staff notification queue.
- **Key Fields**: `tenantId`, `recipientUserId` (ref `User`), `type`, `channel` (`in_app`, `email`, `sms`, `push`), `title`, `body`, `priority`, `status`, `expiresAt` (TTL index 30 days).
- **Indexes**: `{ tenantId: 1, recipientUserId: 1, status: 1, createdAt: -1 }`.

### `ReportHistory`
- **Purpose**: Generated report export metadata log (CSV, XLSX, PDF).

### `RecommendationEvent`
- **Purpose**: AI recommendation view and click interaction logs.

### `AuditLog`
- **Purpose**: System security audit trail.
- **Key Fields**: `tenantId`, `actorId`, `action`, `targetType`, `targetId`, `metadata`, `ipAddress`, `timestamp`.
- **Indexes**: `{ tenantId: 1, timestamp: -1 }`, `{ tenantId: 1, action: 1, timestamp: -1 }`.
