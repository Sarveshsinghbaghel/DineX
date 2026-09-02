# DineX REST API Endpoints Reference

This document provides an authoritative reference of implemented `/api/v1/*` REST API routes, parameter constraints, authorization permissions, and response formats in DineX.

---

## 1. Health & System Routes

| Method | Endpoint | Auth | Permission | Description |
|---|---|---|---|---|
| `GET` | `/health` | None | None | Liveness probe returning safe service health metadata. |
| `GET` | `/readiness` | None | None | Readiness probe checking active database connection (`503` if disconnected). |

---

## 2. Authentication & Profile Routes (`/api/v1/auth`, `/api/v1/users`)

| Method | Endpoint | Auth | Permission | Description |
|---|---|---|---|---|
| `POST` | `/api/v1/auth/register` | None | None | Register new customer account. Rate limited (25 req/15m). |
| `POST` | `/api/v1/auth/login` | None | None | Authenticate user and issue JWT tokens. Rate limited (25 req/15m). |
| `POST` | `/api/v1/auth/refresh` | Cookie | None | Atomically rotate refresh token and issue new access token. |
| `POST` | `/api/v1/auth/logout` | Required | None | Revoke current user session. |
| `GET` | `/api/v1/users/me` | Required | None | Fetch logged-in user profile. |
| `PATCH` | `/api/v1/users/me` | Required | None | Update own profile (name, phone). |
| `POST` | `/api/v1/users/me/avatar` | Required | None | Upload user avatar (binary magic byte validated PNG/JPEG/WebP). |
| `POST` | `/api/v1/users/me/addresses` | Required | None | Add customer delivery address. |
| `GET` | `/api/v1/users/me/addresses` | Required | None | List customer delivery addresses. |
| `GET` | `/api/v1/users` | Required | `users.read` | Admin user list search, filter, and pagination. |

---

## 3. Restaurant & Branch Administration (`/api/v1/restaurants`, `/api/v1/branches`)

| Method | Endpoint | Auth | Permission | Description |
|---|---|---|---|---|
| `POST` | `/api/v1/restaurants` | Required | `restaurants.manage` | Create top-level restaurant enterprise. |
| `GET` | `/api/v1/restaurants/:id` | Required | `restaurants.view` | Retrieve restaurant details. |
| `POST` | `/api/v1/branches` | Required | `branches.manage` | Create new branch outlet. |
| `GET` | `/api/v1/branches/:id` | Required | `branches.view` | Retrieve branch operational details. |

---

## 4. Public Customer QR Ordering (`/api/v1/qr`)

| Method | Endpoint | Auth | Permission | Description |
|---|---|---|---|---|
| `GET` | `/api/v1/qr/validate/:token` | None | None | Validate table QR code token. |
| `GET` | `/api/v1/qr/menu/:token` | None | None | Fetch public mobile menu with AI recommendations. |
| `POST` | `/api/v1/qr/checkout/:token` | Optional | None | Server-authoritative QR checkout. Rate limited (50 req/15m). |
| `GET` | `/api/v1/qr/order/:orderId/status` | None | None | Track live QR order status. |
| `POST` | `/api/v1/qr/tables` | Required | `tables.manage` | Create physical dining table and generate QR code. |

---

## 5. Online Delivery Fulfillment (`/api/v1/delivery`)

| Method | Endpoint | Auth | Permission | Description |
|---|---|---|---|---|
| `POST` | `/api/v1/delivery/serviceability` | None | None | Check branch serviceability and calculate delivery fee. |
| `POST` | `/api/v1/delivery/checkout` | Required | None | Server-authoritative delivery checkout. Rate limited (50 req/15m). |
| `POST` | `/api/v1/delivery/orders/:id/assign` | Required | `delivery.manage` | Assign delivery driver to order. |
| `GET` | `/api/v1/delivery/driver/orders` | Required | `delivery.fulfill` | List assigned deliveries for driver. |
| `PATCH` | `/api/v1/delivery/orders/:id/status` | Required | `delivery.fulfill` | Driver update delivery status (`out_for_delivery`, `delivered`). |
| `GET` | `/api/v1/delivery/orders/:id/track` | Required | None | Customer live delivery tracking. |

---

## 6. Analytics & Reports (`/api/v1/analytics`, `/api/v1/reports`)

| Method | Endpoint | Auth | Permission | Description |
|---|---|---|---|---|
| `GET` | `/api/v1/analytics/summary` | Required | `analytics.read` | Dashboard analytics summary KPIs (`period`, `branchId`). |
| `GET` | `/api/v1/reports/export` | Required | `reports.export` | Generate and download CSV, XLSX, or PDF reports (`30 req/15m`). |

---

## 7. AI Recommendations (`/api/v1/recommendations`)

| Method | Endpoint | Auth | Permission | Description |
|---|---|---|---|---|
| `GET` | `/api/v1/recommendations/user` | Required | None | Fetch personalized user recommendations. |
| `GET` | `/api/v1/recommendations/cart` | None | None | Fetch item add-on recommendations for cart. |
