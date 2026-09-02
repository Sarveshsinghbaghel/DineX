# DineX Quality Assurance & Testing Architecture

This document details the testing strategy, test suites, execution commands, deterministic fixture patterns, and CI automation for the DineX Restaurant Management System.

---

## 1. Testing Strategy & Test Pyramid

DineX enforces a strict multi-layered testing strategy ensuring system reliability, financial accuracy, zero-trust security, and real-time Socket.IO room isolation.

```
       / \
      / E2E \       -> Real-time E2E Journeys (QR Scan, Delivery, Orders)
     /------- \
    / Security \     -> NoSQL Stripping, Session Revocation, Rate Limiting
   /------------\
  / Integration  \   -> API Endpoints, RBAC Boundary Checks, Tenant Scoping
 /----------------\
/   Unit & Logic   \ -> Calculation Engines, Schema Validation, Helpers
--------------------
```

---

## 2. Test Execution Commands

Run tests across all workspaces or individually using npm workspace commands:

| Scope | Command | Description |
|---|---|---|
| **All Workspaces** | `npm test` | Runs typechecks, unit tests, integration tests, and security tests across `@x10think/api`, `@x10think/web`, `@x10think/worker`. |
| **API Workspace** | `npm test --workspace=@x10think/api` | Runs TypeScript compilation check and Node.js native test runner on `apps/api/src/tests/**/*.test.ts`. |
| **Web Workspace** | `npm test --workspace=@x10think/web` | Runs frontend component, permissions, and route tests in `apps/web/src/tests/**/*.test.ts`. |
| **Type Check** | `npm run typecheck` | Validates strict TypeScript compilation (`noAny`, zero implicit conversions) across all packages. |

---

## 3. Test Suites & Coverage Overview

The DineX API test suite includes 16 specialized test modules covering all application phases:

1. [`auth-components.test.ts`](file:///Users/sarveshsinghbaghel/Documents/Resturent/apps/api/src/tests/auth-components.test.ts) — Authentication, registration, password hashing, and token issuance.
2. [`user-profile.test.ts`](file:///Users/sarveshsinghbaghel/Documents/Resturent/apps/api/src/tests/user-profile.test.ts) — User profile management, address CRUD, avatar uploads.
3. [`restaurant-branch.test.ts`](file:///Users/sarveshsinghbaghel/Documents/Resturent/apps/api/src/tests/restaurant-branch.test.ts) — Restaurant configuration, branch lifecycle, business hours precedence.
4. [`phases-13-16.test.ts`](file:///Users/sarveshsinghbaghel/Documents/Resturent/apps/api/src/tests/phases-13-16.test.ts) — Menu administration, tables, reservations, cart, order lifecycle, inventory deductions, notifications.
5. [`phases-17-18.test.ts`](file:///Users/sarveshsinghbaghel/Documents/Resturent/apps/api/src/tests/phases-17-18.test.ts) — Analytics aggregations, date boundary resolution, report exports (CSV, XLSX, PDF).
6. [`phase-19.test.ts`](file:///Users/sarveshsinghbaghel/Documents/Resturent/apps/api/src/tests/phase-19.test.ts) — Staff recommendation insights, personalized customer item recommendations.
7. [`phase-20.test.ts`](file:///Users/sarveshsinghbaghel/Documents/Resturent/apps/api/src/tests/phase-20.test.ts) — Customer QR Ordering token lifecycle, public menu, server-authoritative checkout.
8. [`phase-21.test.ts`](file:///Users/sarveshsinghbaghel/Documents/Resturent/apps/api/src/tests/phase-21.test.ts) — Delivery address management, serviceability checks, driver assignment, customer delivery tracking.
9. [`phase-22-security.test.ts`](file:///Users/sarveshsinghbaghel/Documents/Resturent/apps/api/src/tests/phase-22-security.test.ts) — Session revocation verification, NoSQL operator sanitizer, spreadsheet formula protection.
10. [`phase-23-performance.test.ts`](file:///Users/sarveshsinghbaghel/Documents/Resturent/apps/api/src/tests/phase-23-performance.test.ts) — Database compound index query latency (< 50ms), parallelized analytics execution, asset auto-compression.
11. [`phase-24-qa-e2e.test.ts`](file:///Users/sarveshsinghbaghel/Documents/Resturent/apps/api/src/tests/phase-24-qa-e2e.test.ts) — Full customer E2E journeys (Dine-In QR, Delivery), Socket.IO room emitter isolation, zero-trust price tampering defense.

---

## 4. Environment & Fixture Strategy

- **Isolated Test Database**: Tests connect to a dedicated MongoDB test database instance (`mongodb://localhost:27017/dinex-test`).
- **Deterministic Fixtures**: All entities (Users, Restaurants, Branches, Tables, Orders) use synthetic test data scoped by unique `tenantId` (e.g. `tenant_qa_24`).
- **Automated Cleanup**: Every test suite cleans up seeded documents in `before()` and `after()` hooks to ensure non-interfering test runs.

---

## 5. CI Pipeline Integration

GitHub Actions workflow ([`.github/workflows/ci.yml`](file:///Users/sarveshsinghbaghel/Documents/Resturent/.github/workflows/ci.yml)) automatically executes on every pull request and commit to main branches:

```yaml
steps:
  - run: npm ci
  - run: npm run lint
  - run: npm run format:check
  - run: npm run typecheck
  - run: npm run build
  - run: npm run test
```
