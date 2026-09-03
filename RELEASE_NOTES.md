# DineX v1.0.0 Release Notes

**Release Version**: 1.0.0  
**Release Date**: September 3, 2026  
**Status**: General Availability (GA) — Release Candidate Ready  

---

## 🌟 Executive Release Overview

DineX v1.0.0 is the inaugural production release of the next-generation multi-tenant Restaurant Management System. Built on a modern TypeScript monorepo architecture (`React 19` + `Node.js 22 / Express 5` + `MongoDB Atlas` + `Socket.IO 4`), DineX provides an integrated platform for Dine-In QR ordering, direct online delivery fulfillment, real-time Kitchen Display Systems (KDS), inventory tracking, financial data exports, and AI-driven menu recommendations.

---

## 🚀 Key Feature Highlights

### 1. Multi-Tenant Architecture & 7-Role RBAC
- Enterprise multi-tenant isolation with strict branch boundary enforcement (`user.branchIds`).
- Server-authoritative Role-Based Access Control (RBAC) across 7 system roles: `Customer`, `Waiter`, `Chef`, `Cashier`, `Manager`, `Admin`, `Super Admin`.

### 2. Dual-Token Authentication & Session Revocation
- Stateless access tokens (15m TTL) paired with stateful refresh tokens stored in `HTTP-Only`, `SameSite=Lax`, `Secure` cookies (30d TTL).
- Atomic refresh token rotation with instant session revocation upon logout, password change, or admin suspension.

### 3. Server-Authoritative Zero-Trust Checkout
- 100% server-calculated financial pricing for Dine-In QR and Delivery checkouts.
- Automatic tax calculations (5% GST), branch-level discounts, and flat (₹50) vs free-delivery threshold (> ₹500) rules.

### 4. Real-Time Kitchen Display System (KDS)
- Socket.IO WebSocket room broadcasting (`branch:${branchId}`) pushing instant order events (`placed` -> `preparing` -> `ready` -> `served`).

### 5. Automated Inventory & Procurement
- Recipe ingredient mapping with automatic stock deduction upon order completion.
- Reorder level alerts and stock movement audit trails (`inbound`, `outbound`, `waste`, `adjustment`).

### 6. Financial Reporting & Formula Injection Defense
- Streamed generation of CSV, XLSX, and PDF sales, inventory, tax, and employee reports.
- Protection against Spreadsheet Formula Injection by prepending single quotes (`'`) to string cells starting with `=`, `+`, `-`, `@`, `\t`, or `\r`.

### 7. AI Menu Recommendations & Customer Engagement
- Item co-occurrence analysis generating personalized guest add-ons during checkout.
- Automated loyalty points balance tracking and customer review management.

---

## 🛡️ Security Hardening & Audit Highlights
- **NoSQL Injection**: Express `nosqlSanitizeMiddleware` recursively strips `$` and `.` operator keys from bodies, query strings, and URL parameters.
- **File Upload Security**: Cloudinary buffer uploads check binary magic bytes (`[0x89, 0x50, 0x4E, 0x47]` for PNG, `[0xFF, 0xD8, 0xFF]` for JPEG, `RIFF...WEBP` for WebP).
- **CORS & Rate Limiting**: Restricted CORS origins with rate limiters on auth (25 req/15m), checkout (50 req/15m), and exports (30 req/15m).

---

## ⚡ Performance Measurements
- **Query Latency**: Compound indexing on `Order`, `AuditLog`, and `Inventory` collections maintains benchmark query response time below **50ms**.
- **Frontend Bundle Optimization**: Code-splitting via React `lazy()` and `<Suspense>` divides UI routes into 20 small chunks with an initial payload under 250 kB gzipped.

---

## 📦 Deployment Topology
- **Web Frontend**: Vercel Edge Network Single Page Application (`apps/web/vercel.json`).
- **REST API Server**: Render Web Service (`render.yaml`) with `/health` liveness and `/readiness` database probes.
- **Containerization**: Multi-stage production [`Dockerfile`](file:///Users/sarveshsinghbaghel/Documents/Resturent/Dockerfile) utilizing non-root `USER node` execution.
- **CI/CD Pipeline**: GitHub Actions [`ci.yml`](file:///Users/sarveshsinghbaghel/Documents/Resturent/.github/workflows/ci.yml) validating typecheck, linting, tests, and Docker container builds.

---

## 📋 Release Quality Gate Summary

```
✔ ESLint Code Quality: 0 errors, 0 warnings
✔ TypeScript Compilation: 0 errors across 9 workspace packages
✔ Automated Test Suite: 71/71 tests passing (16 test suites)
✔ Production Bundle Build: 0 errors
✔ Security & Secret Audit: Zero hardcoded secrets, .env ignored
```

**Final Verdict**: `RELEASE CANDIDATE READY`
