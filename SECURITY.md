# DineX Security Architecture & Production Policy

This document details the security model, authorization controls, tenant boundary enforcement, input sanitization policies, and production security checklist for the DineX Restaurant Management System.

---

## 1. Authentication & Session Architecture

- **Password Hashing**: Passwords are hashed using `bcrypt` with cost factor `BCRYPT_ROUNDS=12`.
- **JWT Architecture**: Dual-token architecture using stateless access tokens (`ACCESS_TOKEN_TTL=15m`) and stateful refresh tokens stored in HTTP-Only cookies (`REFRESH_TOKEN_TTL_DAYS=30d`).
- **Session Revocation**: Every access token contains a session identifier (`sid`). In `requireAuth` middleware, sessions are checked against the MongoDB `Session` collection to enforce instant session revocation upon logout, password reset, or admin suspension.
- **Refresh Token Rotation**: Refresh tokens are single-use. When a refresh token is presented to `/api/v1/auth/refresh`, it is atomically rotated and replaced with a new token hash (`refreshTokenHash`). Attempting to reuse an old refresh token immediately invalidates the entire session and logs a security warning.
- **Account Lockout**: After 5 consecutive failed login attempts, accounts are locked for 15 minutes (`AUTH_ACCOUNT_LOCKED`).

---

## 2. Authorization & Tenant Isolation (RBAC)

- **Hierarchy**: All business operations follow strict multi-tenant boundary checks:
  `Restaurant → Branch → Resource`
- **Role-Based Access Control (RBAC)**: Enforced via `requirePermission('permission.code')` and `requireRole('role_code')` backend middleware.
- **Branch Scope Boundary**: Staff and branch managers are restricted to their assigned branch IDs (`user.branchIds`). Attempts to access resources belonging to a different branch yield `403 FORBIDDEN` / `ACCESS_DENIED`.
- **Frontend Authorization**: Frontend route protections and button visibility are UX-only; server-side authorization is strict and authoritative.

---

## 3. Input & Query Security

- **NoSQL Operator Sanitization**: Express request body, query parameters, and route parameters are recursively sanitized by `nosqlSanitizeMiddleware`. Any property key beginning with `$` (such as `$gt`, `$ne`, `$where`, `$regex`) or containing dot notation injection is automatically stripped before reaching controllers or services.
- **Schema Validation**: All input DTOs are validated using strict `Zod` schemas in `@x10think/validation`.

---

## 4. Financial & Order Integrity

- **Server-Authoritative Pricing**: Item prices, subtotals, tax calculations (5% GST), delivery fees (flat ₹50 vs free delivery over ₹500), and grand totals are calculated server-side during checkout (`/qr/checkout`, `/delivery/checkout`). Client-submitted totals or unit prices are ignored.

---

## 5. File Upload Security

- **Magic Byte Validation**: Cloudinary image uploads (`validateImageBuffer`) verify the binary magic bytes (`[0x89, 0x50, 0x4E, 0x47]` for PNG, `[0xFF, 0xD8, 0xFF]` for JPEG, `RIFF...WEBP` for WebP). Disguised executables, scripts, or non-image files are rejected with `415 UNSUPPORTED_MEDIA_TYPE`.
- **Size Limits**: Maximum allowed file upload size is strictly capped at 5 MB.

---

## 6. Output & Export Security

- **CSV / XLSX Formula Injection Protection**: All string cell values in CSV and Excel exports starting with dangerous formula characters (`=`, `+`, `-`, `@`, `\t`, `\r`) are sanitized by prepending a single quote (`'`), preventing formula execution when opened in Microsoft Excel or Google Sheets.

---

## 7. Rate Limiting

- **Global Rate Limiting**: Capped at 300 requests / 15 minutes window.
- **Authentication Rate Limiting**: Capped at 25 requests / 15 minutes for `/auth/login`, `/auth/register`, `/auth/forgot-password`, `/auth/reset-password`.
- **Checkout Rate Limiting**: Capped at 50 requests / 15 minutes for QR and Delivery checkout endpoints.
- **Export Rate Limiting**: Capped at 30 requests / 15 minutes for report file generation.

---

## 8. Secrets & Logging Policy

- **No Hardcoded Secrets**: Secrets are loaded exclusively from environment variables validated via Zod (`envSchema`).
- **Git Hygiene**: `.env` and `.env.local` files are strictly listed in `.gitignore`. `.env.example` contains non-sensitive placeholders only.
- **Log Sanitation**: Passwords, raw JWT tokens, refresh tokens, credit card data, and authorization headers are omitted from application loggers (`Winston` & `Morgan`).

---

## 9. Production Security Checklist

- [x] Environment variable secrets validated on startup.
- [x] Password hashing using bcrypt (rounds >= 10).
- [x] JWT secrets minimum 32 characters.
- [x] Session revocation verified in `requireAuth` middleware.
- [x] NoSQL operator sanitization middleware active.
- [x] Server-authoritative checkout financial recalculations enforced.
- [x] File upload binary magic byte validation enabled.
- [x] Spreadsheet formula injection protection applied.
- [x] Security headers configured via `Helmet`.
- [x] CORS restricted to authorized origin.
