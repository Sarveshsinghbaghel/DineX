# DineX — Technical Interview Reference Guide

This reference provides technical explanations for 20 architectural and implementation interview questions based directly on the DineX codebase.

---

### Q1: Why did you choose a layered monorepo architecture for DineX?
**Answer**: A layered monorepo (`Routes → Middleware → Controllers → Services → Repositories → DB`) provides strict separation of concerns, single-responsibility code, and shared TypeScript type packages (`@x10think/types`, `@x10think/validation`, `@x10think/constants`) across frontend and backend. It eliminates code duplication while keeping Express controllers thin and reusable.

### Q2: Why choose React 19 for the web application?
**Answer**: React 19 delivers modern concurrent rendering features, built-in support for dynamic route code-splitting via `React.lazy()` and `<Suspense>`, and seamless integration with TanStack Query v5 for server state caching. This ensures smooth UI rendering without unnecessary re-renders during high-frequency realtime updates.

### Q3: Why choose Node.js and Express 5 for the API backend?
**Answer**: Node.js provides a high-performance, non-blocking I/O event loop ideal for concurrent WebSocket connections (Socket.IO) and HTTP requests. Express 5 provides robust middleware composition and native promise rejection handling in async routes.

### Q4: Why choose MongoDB over a traditional relational SQL database?
**Answer**: Restaurant menus, item customizations, order snapshots, and flexible settings require dynamic schemas. MongoDB's document model allows storing nested order item snapshots (preserving price at time of purchase) alongside fast indexing on compound fields like `{ tenantId: 1, serviceMode: 1, status: 1 }`.

### Q5: How is multi-tenant isolation enforced?
**Answer**: Every domain collection contains a required `tenantId` field. Middleware extracts `tenantId` from authenticated JWT claims or headers, ensuring database queries are scoped (`find({ tenantId, ... })`). Staff operations further enforce branch boundaries (`user.branchIds`).

### Q6: How does the dual-token JWT authentication system work?
**Answer**: Short-lived access tokens (15m) are passed in HTTP headers (`Authorization: Bearer <token>`). Long-lived refresh tokens (30d) are stored in `HTTP-Only`, `SameSite=Lax`, `Secure` cookies. Refresh tokens are single-use and atomically rotated upon refresh (`/auth/refresh`); reuse attempts trigger immediate session revocation.

### Q7: How is real-time session revocation achieved with stateless JWTs?
**Answer**: Every access token contains a session ID (`sid`). The `requireAuth` middleware validates `sid` against the MongoDB `Session` collection. If a user logs out, resets their password, or is suspended by an admin, `Session.revokedAt` is set, invalidating the access token immediately regardless of token expiry.

### Q8: How does server-authoritative checkout pricing work?
**Answer**: During QR or Delivery checkout, client-submitted prices or subtotals are completely ignored. The backend fetches item master prices from the database, applies branch-specific active discounts, calculates 5% GST and delivery fees, and computes grand totals server-side.

### Q9: How are real-time updates implemented in the Kitchen Display System (KDS)?
**Answer**: Using Socket.IO room broadcasting. Upon successful order placement, the server emits a `kitchen_new_order` event to the specific branch room (`branch:${branchId}`). Only authenticated staff joined to that branch room receive the update in real time.

### Q10: How does public table QR ordering function securely without user login?
**Answer**: Dining tables have unique cryptographically generated `qrToken` values stored in MongoDB. The public QR menu route (`/qr/menu/:token`) validates the token and context without requiring customer authentication, while checkout recalculates prices server-side.

### Q11: How does automatic inventory deduction operate?
**Answer**: Recipes link menu items to raw ingredients with required quantities. When an order transitions to `completed`, the Inventory Service atomically decrements ingredient stock (`currentQuantity`) via Mongoose transactions and creates an auditing `StockTransaction` record.

### Q12: How are CSV/XLSX exports protected against Spreadsheet Formula Injection?
**Answer**: In `export-generators.ts`, all string values beginning with formula triggers (`=`, `+`, `-`, `@`, `\t`, `\r`) are sanitized by prepending a single quote (`'`), preventing formula execution when opened in Microsoft Excel or Google Sheets.

### Q13: How does the AI menu recommendation engine work?
**Answer**: The recommendation service analyzes customer order history and item co-occurrence matrices to suggest complementary items during cart checkout (e.g., suggesting beverages with entrees). Interaction events are logged in `RecommendationEvent`.

### Q14: How is online delivery serviceability calculated?
**Answer**: When a customer enters a delivery address, the delivery service calculates Haversine distance against branch coordinates, verifies maximum radius limits, and applies flat (₹50) or free-delivery thresholds (> ₹500).

### Q15: How is performance optimized for large analytics aggregations?
**Answer**: By using MongoDB aggregation pipelines combined with `.lean()` execution to bypass Mongoose document hydration overhead, compound indexes on query fields, and parallelizing summary queries via `Promise.all`.

### Q16: How is input sanitization enforced against NoSQL injection?
**Answer**: Express middleware (`nosqlSanitizeMiddleware`) recursively inspects request bodies, query strings, and URL parameters, stripping property keys containing `$` or dot notation before requests reach controllers.

### Q17: How is file upload security handled for user avatars?
**Answer**: Avatar uploads validate binary magic bytes (`[0x89, 0x50, 0x4E, 0x47]` for PNG, `[0xFF, 0xD8, 0xFF]` for JPEG) before streaming to Cloudinary. Files with fake extensions or non-image buffers are rejected with `415 Unsupported Media Type`.

### Q18: What is the testing strategy for DineX?
**Answer**: DineX employs a dual-level automated test suite featuring Node.js native test runner (`node --test`). 64 API integration tests cover backend routes and business logic, while 7 Web component tests validate frontend routing and form states (totaling 71 passing tests).

### Q19: How is CI/CD configured?
**Answer**: GitHub Actions (`ci.yml`) triggers on pull requests and pushes to `master`. It executes ESLint (`max-warnings=0`), TypeScript compilation across 9 workspace packages, unit/integration test suites, and validates production Docker container builds.

### Q20: How would you scale DineX for 100x traffic growth?
**Answer**:
1. Add Socket.IO Redis Adapter to support multi-instance WebSocket nodes.
2. Read-heavy operations (Menu browsing, Public QR menus) can be cached in Redis with TTL invalidation on menu updates.
3. MongoDB database read-preference can be directed to secondary replica set nodes.
