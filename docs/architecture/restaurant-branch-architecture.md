# Restaurant & Branch Management Architecture — DineX

This document describes the technical architecture, domain models, API endpoints, business hours logic, settings precedence, and authorization boundaries for **Restaurant & Branch Management** in **DineX**.

## 1. Domain Overview & Hierarchy

The organizational hierarchy is structured as follows:

```
[System Defaults]
       │
       ▼
[Restaurant / Tenant Root] ── (Tenant Settings)
       │
       ├──► [Branch 1] ───── (Branch Settings Overrides)
       ├──► [Branch 2] ───── (Branch Settings Overrides)
       └──► [Branch N] ───── (Branch Settings Overrides)
```

1. **Restaurant**: Root organizational entity for a business tenant. Stores legal profile, branding logo (Cloudinary), contact info, tax config, default currency/timezone, and tenant settings.
2. **Branch**: Physical or operational dining location. Must belong to a valid `Restaurant` (orphan branches are prohibited). Branch `code` is uppercase-safe and unique per restaurant scope.
3. **Business Hours**: Weekly operating intervals (e.g. 18:00 to 02:00 overnight) per weekday using the restaurant/branch timezone.
4. **Settings Precedence**: Settings are resolved dynamically following:
   `Branch Settings Overrides -> Restaurant Tenant Settings -> System Default Settings`.

---

## 2. API Endpoints

### Restaurant Endpoints (`/restaurants`)

| Endpoint                                           | Method | Description                                                     | Permission Required  |
| -------------------------------------------------- | ------ | --------------------------------------------------------------- | -------------------- |
| `/api/v1/restaurants`                              | GET    | List restaurants (scope-aware)                                  | `restaurants.view`   |
| `/api/v1/restaurants`                              | POST   | Create restaurant (tenant root creation)                        | `restaurants.manage` |
| `/api/v1/restaurants/:restaurantId`                | GET    | Retrieve restaurant details                                     | `restaurants.view`   |
| `/api/v1/restaurants/:restaurantId`                | PATCH  | Update restaurant profile / legal info                          | `restaurants.manage` |
| `/api/v1/restaurants/:restaurantId/status`         | PATCH  | Change status (`ACTIVE`, `INACTIVE`, `SUSPENDED`, `ONBOARDING`) | `restaurants.manage` |
| `/api/v1/restaurants/:restaurantId/business-hours` | GET    | Read weekly business hours                                      | `restaurants.view`   |
| `/api/v1/restaurants/:restaurantId/business-hours` | PUT    | Replace weekly business hours                                   | `restaurants.manage` |
| `/api/v1/restaurants/:restaurantId/settings`       | GET    | Read tenant settings                                            | `settings.manage`    |
| `/api/v1/restaurants/:restaurantId/settings`       | PATCH  | Update tenant settings                                          | `settings.manage`    |

### Branch Endpoints (`/branches`)

| Endpoint                              | Method | Description                                                      | Permission Required |
| ------------------------------------- | ------ | ---------------------------------------------------------------- | ------------------- |
| `/api/v1/branches`                    | GET    | List / search / filter branches                                  | `branches.view`     |
| `/api/v1/branches`                    | POST   | Create branch under restaurant (Unique code check)               | `branches.manage`   |
| `/api/v1/branches/:branchId`          | GET    | Retrieve branch details                                          | `branches.view`     |
| `/api/v1/branches/:branchId`          | PATCH  | Update branch profile / capacity / service modes                 | `branches.manage`   |
| `/api/v1/branches/:branchId/status`   | PATCH  | Change operational status (`ACTIVE`, `TEMPORARILY_CLOSED`, etc.) | `branches.manage`   |
| `/api/v1/branches/:branchId/settings` | GET    | Read effective branch settings (with overrides)                  | `settings.manage`   |
| `/api/v1/branches/:branchId/settings` | PATCH  | Set branch setting overrides                                     | `settings.manage`   |

---

## 3. Business Hours & Overnight Support

Weekly business hours are stored as an array of weekday configurations:

```typescript
export interface BusinessHoursInterval {
  open: string; // HH:mm 24-hour e.g. "18:00"
  close: string; // HH:mm 24-hour e.g. "02:00"
  isClosed?: boolean;
}
```

- Overnight intervals (where `close < open`, e.g. 18:00 to 02:00) are recognized as spanning into the next calendar day.
- Validation checks verify valid HH:mm time format and prevent overlapping intervals per day.

---

## 4. Settings Resolution Precedence

When querying configuration keys (e.g. `tax.default_rate`, `order.auto_accept`), the system evaluates values in order:

1. **Branch Overrides**: Looked up in `Setting` collection for `{ tenantId, scope: 'branch', branchId, key, status: 'active' }`.
2. **Restaurant Settings**: Looked up in `Setting` collection for `{ tenantId, scope: 'tenant', key, status: 'active' }`.
3. **System Defaults**: Hardcoded fallback values defined in `SYSTEM_DEFAULT_SETTINGS`.

---

## 5. Authorization & Boundary Enforcement

- **Super Admin**: Access across all restaurants and branches.
- **Admin / Owner**: Access scoped to their assigned `tenantId`. Cross-tenant manipulation returns `403 Forbidden`.
- **Manager**: Access restricted to assigned `branchIds` on their user context. Accessing unassigned branches returns `403 Forbidden`.
- **Audit Logging**: Audited actions: `RESTAURANT_CREATED`, `RESTAURANT_UPDATED`, `RESTAURANT_STATUS_CHANGED`, `BRANCH_CREATED`, `BRANCH_UPDATED`, `BRANCH_STATUS_CHANGED`, `RESTAURANT_SETTINGS_UPDATED`, `BRANCH_SETTINGS_UPDATED`, `BUSINESS_HOURS_UPDATED`.
