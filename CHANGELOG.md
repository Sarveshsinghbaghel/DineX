# DineX Changelog

All notable changes to the DineX Restaurant Management System will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-09-03

### Added
- **Authentication & RBAC**: Dual-token JWT (access: 15m, refresh cookie: 30d), atomic token rotation, instant session revocation, 7 system roles (`Customer`, `Waiter`, `Chef`, `Cashier`, `Manager`, `Admin`, `Super Admin`).
- **Multi-Tenant System**: Restaurant and branch outlet models with branch-scoped authorization (`user.branchIds`).
- **Public Guest QR Ordering**: Public menu route (`/qr/menu/:token`), server-side table status updates to `occupied`, live order tracking.
- **Online Delivery Fulfillment**: Serviceability calculation, delivery fee rules (flat ₹50 vs free delivery over ₹500), driver assignment, live tracking status updates.
- **Real-Time KDS**: Socket.IO room broadcasting (`branch:${branchId}`) pushing real-time order lifecycle status updates.
- **Inventory & Procurement**: Ingredient stock tracking, automated order stock consumption, reorder alerts, supplier purchase orders, stock transaction logging.
- **Financial Exports**: CSV, XLSX, and PDF report generators for sales, tax, inventory, and employee performance.
- **AI Recommendations & Loyalty**: Cart add-on suggestions, interaction logging (`RecommendationEvent`), loyalty points accrual.
- **Security Audit Trails**: Administrative action logging in `AuditLog` collection.
- **DevOps & Containerization**: Multi-stage production `Dockerfile`, Vercel SPA manifest (`vercel.json`), Render service blueprint (`render.yaml`), health probes (`/health`, `/readiness`), GitHub Actions CI (`ci.yml`).

### Changed
- **Express 5 Middleware**: Refactored `nosqlSanitizeMiddleware` to mutate `req.query` and `req.params` properties in place for Express 5 getter property compatibility.
- **Frontend Code Splitting**: Converted page routes to React `lazy()` dynamic imports, generating 20 small chunks for faster page load.

### Security
- **NoSQL Sanitization**: Recursive stripping of `$` and `.` operator keys from input payloads.
- **Formula Injection Defense**: Single quote prepending (`'`) on string cells starting with `=`, `+`, `-`, `@`, `\t`, or `\r` in CSV/XLSX exports.
- **File Magic Byte Check**: Cloudinary avatar upload validation verifying binary magic bytes (`PNG`, `JPEG`, `WebP`).
- **Strict CORS & Rate Limiting**: Binding to `CLIENT_URL` with rate limits on auth, checkout, and export endpoints.

### Performance
- **Database Indexing**: Compound indexes on `Order` (`{ tenantId: 1, serviceMode: 1, status: 1 }`), `AuditLog` (`{ tenantId: 1, timestamp: -1 }`), and `Inventory` maintaining query latency below 50ms.
- **Parallelized Aggregations**: Refactored analytics queries to use `.lean()` execution and `Promise.all` parallelization.

### Fixed
- Express 5 `TypeError: Cannot set property query of #<IncomingMessage> which has only a getter` in `nosqlSanitizeMiddleware`.
- Unhandled error logging in central `errorHandler`.
- ESLint type-checked rules configuration across 9 workspace packages.

### Documentation
- Updated `README.md`, `SECURITY.md`, `TESTING.md`, `DEPLOYMENT.md`, `DEVELOPER_ONBOARDING.md`, `docs/architecture/system-architecture.md`, `docs/database/models-schema-reference.md`, `docs/api/endpoints-reference.md`, `ACADEMIC_PROJECT_REPORT.md`, `DEMO_PITCH_GUIDE.md`, `TECHNICAL_INTERVIEW_GUIDE.md`, `PORTFOLIO_SUMMARY.md`, and `RELEASE_NOTES.md`.

### Known Limitations
- Socket.IO multi-node clustering requires attaching Redis Adapter for horizontal WebSocket scaling.
- ESC/POS thermal receipt printing currently uses native browser print dialogs.
