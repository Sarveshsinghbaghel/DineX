# DineX Production Deployment & Operations Handbook

This handbook documents the production deployment architecture, environment configurations, Docker containerization, platform setups (Vercel, Render, MongoDB Atlas), backup/restore operations, and rollback procedures for the DineX Restaurant Management System.

---

## 1. Architecture & Hosting Topology

```
+-----------------------------------------------------------------------------------+
|                                  PRODUCTION TOPOLOGY                              |
|                                                                                   |
|   Frontend: Vercel (SPA Global Edge Network)                                      |
|   `-- Static Bundle Assets (Vite React 19)                                        |
|   `-- Single-Page Application Routes (`/index.html` fallback)                      |
|                                                                                   |
|   Backend: Render (Containerized Web Service)                                      |
|   `-- Node.js 22 Multi-Stage Docker Image (`Dockerfile`)                          |
|   `-- Express API Engine + Socket.IO Server                                       |
|   `-- Health Probes: `/health` (Liveness), `/readiness` (MongoDB readiness)       |
|                                                                                   |
|   Database: MongoDB Atlas (Dedicated M10+ Cluster)                                |
|   `-- TLS 1.3 Encryption at Rest & In-Transit                                     |
|   `-- Restricted IP Access List (Render Outbound IPs only)                        |
|                                                                                   |
+-----------------------------------------------------------------------------------+
```

---

## 2. Environment Configuration Matrix

| Variable | Description | Required Environment | Example Value |
|---|---|---|---|
| `NODE_ENV` | Application environment state | API, Worker | `production` |
| `PORT` | HTTP server port binding | API | `4000` |
| `MONGODB_URI` | MongoDB Atlas TLS connection string | API, Worker | `mongodb+srv://user:pass@cluster.mongodb.net/dinex_prod` |
| `JWT_ACCESS_SECRET` | Secret key for signing 15-minute access JWTs | API | `super-secret-crypto-access-key` |
| `JWT_REFRESH_SECRET` | Secret key for signing 7-day refresh JWTs | API | `super-secret-crypto-refresh-key` |
| `CLIENT_URL` | Frontend origin for CORS whitelist | API | `https://dinex.vercel.app` |
| `VITE_API_BASE_URL` | Public API gateway base URL | Web (Vercel) | `https://dinex-api.onrender.com/api/v1` |

> [!CAUTION]
> Never commit secrets or `.env` files to source control. Never prefix backend secrets with `VITE_`.

---

## 3. Frontend Deployment (Vercel)

1. Connect GitHub repository to Vercel.
2. Set Root Directory to `apps/web`.
3. Set Framework Preset to **Vite**.
4. Configure Environment Variables:
   - `VITE_API_BASE_URL` = `https://dinex-api.onrender.com/api/v1`
5. Deploy. Routing rewrites are automatically governed by [`apps/web/vercel.json`](file:///Users/sarveshsinghbaghel/Documents/Resturent/apps/web/vercel.json).

---

## 4. Backend Deployment (Render)

1. Connect GitHub repository to Render using `render.yaml` Blueprint or manual Web Service creation.
2. Select **Docker** environment using root [`Dockerfile`](file:///Users/sarveshsinghbaghel/Documents/Resturent/Dockerfile).
3. Set Health Check Path to `/health`.
4. Configure Environment Variables in Render Dashboard.
5. Deploy Web Service.

---

## 5. MongoDB Atlas Production Security & Backups

1. **Network Access**: Add Render outbound IP addresses to Atlas Network Access IP Whitelist.
2. **Database User**: Create a least-privilege database user with `readWrite` role scoped strictly to the `dinex_prod` database.
3. **Automated Backups**: Enable Continuous Cloud Backups with point-in-time recovery (PITR) in MongoDB Atlas.

---

## 6. Rollback Procedures

### Frontend Rollback (Vercel)
- Navigate to Vercel Deployments dashboard.
- Select the previous stable deployment build and click **Promote to Production**.

### Backend Rollback (Render)
- Navigate to Render Deploys dashboard.
- Select the previous stable commit build and click **Rollback to this deploy**.

---

## 7. Production Checklist

- [x] All automated CI quality gates pass (`typecheck`, `build`, `test`).
- [x] Server-authoritative security controls and rate limiters active.
- [x] CORS restricted to exact client domain.
- [x] Health (`/health`) and readiness (`/readiness`) probes operational.
- [x] Graceful shutdown handling `SIGTERM` and `SIGINT`.
- [x] No secrets committed to source control.
