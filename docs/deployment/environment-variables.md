# Environment Variables

## Root Workspace

| Variable                           | Required | Purpose                                               |
| ---------------------------------- | -------- | ----------------------------------------------------- |
| `NODE_ENV`                         | Yes      | Sets the default workspace execution mode.            |
| `X10THINK_API_BASE_URL`            | Yes      | Shared local default for client-to-API communication. |
| `X10THINK_WEB_BASE_URL`            | Yes      | Shared local default for browser-facing access.       |
| `X10THINK_API_PORT`                | Yes      | Default API port reference.                           |
| `X10THINK_WEB_PORT`                | Yes      | Default frontend port reference.                      |
| `X10THINK_WORKER_PORT`             | Yes      | Default worker port reference.                        |
| `X10THINK_MONGODB_URI`             | Yes      | Shared development MongoDB connection string.         |
| `X10THINK_MONGODB_DB_NAME`         | Yes      | Default development database name.                    |
| `X10THINK_WORKER_POLL_INTERVAL_MS` | Yes      | Worker heartbeat and scheduling interval foundation.  |

## API Application

| Variable                  | Required | Purpose                                                   |
| ------------------------- | -------- | --------------------------------------------------------- |
| `NODE_ENV`                | Yes      | API runtime mode.                                         |
| `APP_NAME`                | Yes      | Safe service name returned in metadata.                   |
| `APP_VERSION`             | Yes      | Safe version string surfaced by health and logs.          |
| `PORT`                    | Yes      | HTTP server port.                                         |
| `API_PREFIX`              | Yes      | Versioned base path, currently `/api/v1`.                 |
| `CLIENT_URL`              | Yes      | Allowed browser origin for CORS.                          |
| `MONGODB_URI`             | Yes      | MongoDB connection string for local or Atlas usage.       |
| `MONGODB_DB_NAME`         | Yes      | Database name to connect to.                              |
| `DATABASE_STRICT_STARTUP` | Yes      | When `true`, API startup fails if MongoDB cannot connect. |
| `REQUEST_RATE_LIMIT_MAX`  | Yes      | Per-window API rate-limit cap.                            |

## Web Application

| Variable             | Required | Purpose                                        |
| -------------------- | -------- | ---------------------------------------------- |
| `VITE_APP_NAME`      | Yes      | Browser-visible app title.                     |
| `VITE_API_BASE_URL`  | Yes      | API base URL used by the frontend HTTP client. |
| `VITE_DEFAULT_THEME` | Yes      | Initial theme mode seed.                       |

## Worker Application

| Variable                  | Required | Purpose                                                |
| ------------------------- | -------- | ------------------------------------------------------ |
| `NODE_ENV`                | Yes      | Worker runtime mode.                                   |
| `APP_NAME`                | Yes      | Worker service name for logs.                          |
| `APP_VERSION`             | Yes      | Worker version metadata.                               |
| `WORKER_PORT`             | Yes      | Reserved port reference for future worker diagnostics. |
| `WORKER_POLL_INTERVAL_MS` | Yes      | Polling and heartbeat cadence.                         |

## Secret Handling Rules

1. Never commit real credentials.
2. Use environment variables, secret managers, or CI secrets for real deployments.
3. Keep `.env.example` files safe, documented, and credential-free.
