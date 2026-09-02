# DineX — Multi-Tenant Enterprise Restaurant Management System

**DineX** is a full-stack, multi-tenant enterprise restaurant operations platform built as an npm workspace monorepo. It powers multi-branch operations, real-time table management, QR self-ordering, online delivery fulfillment, inventory control, employee attendance, customer engagement, AI recommendations, analytics, and spreadsheet/PDF report exports.

---

## Key Features

- **Multi-Tenant & Multi-Branch Architecture**: Strict data isolation by `tenantId` and `branchId` with hierarchical configuration precedence (`Branch → Restaurant → System Default`).
- **Dine-In QR Ordering System**: Public mobile menu, table QR code generation/regeneration, server-authoritative checkout, zero-trust price calculation, and real-time status tracking.
- **Online Delivery & Order Fulfillment**: Address CRUD, delivery fee threshold calculation, staff driver assignment dashboard, rider mobile portal, and customer live delivery tracking.
- **Role-Based Access Control (RBAC)**: 7 pre-configured system roles (`Customer`, `Waiter`, `Chef`, `Cashier`, `Manager`, `Admin`, `Super Admin`) with granular permission enforcement on every route.
- **Real-Time Socket.IO Updates**: Scoped room broadcasts (`user:id`, `branch:id`) for kitchen notifications, order status changes, and driver updates.
- **Inventory & Procurement**: Ingredient stock management, automatic order deduction, stock adjustment logs, purchase order management, and low-stock alerts.
- **Analytics & Report Generation**: Date-range drilldowns, revenue/order analytics, PDF/XLSX/CSV export generators with formula injection protection.
- **Personalized Recommendations**: Rule-based recommendation engine for upsells, cross-sells, and cold-start fallback.

---

## Technology Stack

- **Frontend (`apps/web`)**: React 19, Vite 7, TypeScript, Tailwind CSS, TanStack Query v5, React Router v7, React Hook Form, Zod.
- **Backend (`apps/api`)**: Node.js 22, Express 5, TypeScript, Mongoose 8, Socket.IO, Helmet, Rate Limiter, Winston.
- **Worker (`apps/worker`)**: Node.js 22, TypeScript background job runtime.
- **Shared Packages (`packages/*`)**: `@x10think/constants`, `@x10think/types`, `@x10think/validation`, `@x10think/ui`, `@x10think/utils`, `@x10think/configuration`.
- **Tooling & CI/CD**: npm workspaces, ESLint, Prettier, Docker multi-stage builds, GitHub Actions, Vercel, Render.

---

## Monorepo Architecture

```text
DineX/
├── apps/
│   ├── api/                  # Express 5 REST API & Socket.IO server
│   ├── web/                  # React 19 single-page application
│   └── worker/               # Background task processing
├── packages/
│   ├── configuration/        # Application environment tokens
│   ├── constants/            # Roles, permissions, status enums
│   ├── types/                # Shared TypeScript contracts
│   ├── ui/                   # Design system components
│   ├── utils/                # Utility functions
│   └── validation/           # Zod validation schemas
├── docs/                     # Architecture, API, and DB specifications
├── infrastructure/           # Dockerfiles & compose manifests
└── TESTING.md / DEPLOYMENT.md
```

---

## Quick Start & Setup

1. **Clone & Install Dependencies**:
   ```bash
   git clone https://github.com/DineX/DineX.git
   cd DineX
   npm install
   ```

2. **Configure Environment Files**:
   ```bash
   cp .env.example .env
   cp apps/api/.env.example apps/api/.env
   cp apps/web/.env.example apps/web/.env
   ```

3. **Seed Database Demo Data & RBAC**:
   ```bash
   npm run seed:demo    # Seeds 7 demo accounts, restaurant, 2 branches, QR tables & orders
   npm run reset:demo   # Resets and re-seeds development demo database
   ```

4. **Start Development Servers**:
   ```bash
   npm run dev:api    # Starts API on http://localhost:4000
   npm run dev:web    # Starts Web UI on http://localhost:5173
   ```

---

## Quality & Testing Commands

DineX features 16 automated integration and unit test suites (71 tests):

```bash
# Run strict TypeScript type checks across all workspaces
npm run typecheck

# Run full test suite (API + Web)
npm test

# Build production bundles
npm run build
```

---

## Security & Deployment

- **Security Overview**: Detailed in [`SECURITY.md`](file:///Users/sarveshsinghbaghel/Documents/Resturent/SECURITY.md) covering session revocation, NoSQL operator sanitizer, rate limiting, and RBAC matrix.
- **Production Deployment**: Detailed in [`DEPLOYMENT.md`](file:///Users/sarveshsinghbaghel/Documents/Resturent/DEPLOYMENT.md) covering Vercel (Frontend), Render (Backend container), and MongoDB Atlas setup.
- **Developer Onboarding**: Detailed in [`DEVELOPER_ONBOARDING.md`](file:///Users/sarveshsinghbaghel/Documents/Resturent/DEVELOPER_ONBOARDING.md).

---

## Documentation Index

- [System Architecture Reference](file:///Users/sarveshsinghbaghel/Documents/Resturent/docs/architecture/system-architecture.md)
- [Database Models Reference](file:///Users/sarveshsinghbaghel/Documents/Resturent/docs/database/models-schema-reference.md)
- [API Endpoints Reference](file:///Users/sarveshsinghbaghel/Documents/Resturent/docs/api/endpoints-reference.md)
- [Security & RBAC Matrix](file:///Users/sarveshsinghbaghel/Documents/Resturent/SECURITY.md)
- [Testing Architecture Guide](file:///Users/sarveshsinghbaghel/Documents/Resturent/TESTING.md)
- [Production Deployment Guide](file:///Users/sarveshsinghbaghel/Documents/Resturent/DEPLOYMENT.md)
