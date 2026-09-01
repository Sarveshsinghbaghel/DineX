# Architecture

## Monorepo Strategy

The repository uses npm workspaces to keep the frontend and backend isolated while sharing project-level standards and scripts. This keeps deployment concerns independent without fragmenting the codebase too early.

## Frontend Architecture

`apps/web` follows a feature-based structure:

- `app`: application-level providers, layouts, and router integration.
- `features`: isolated business modules, each with `components`, `pages`, `hooks`, `services`, `types`, `validation`, and `constants`.
- `shared`: reusable UI primitives, constants, types, and library integrations.

The current application shell provides:

- React Router-based page composition
- TanStack Query client setup
- React Hook Form and Zod integration
- Framer Motion transitions
- Tailwind-driven design tokens and layout system

## Backend Architecture

`apps/api` uses layered architecture:

- `routes`: route registration and versioning
- `controllers`: HTTP orchestration only
- `services`: business logic
- `repositories`: persistence and infrastructure reads
- `models`: domain models and status contracts
- `validators`: request and environment validation
- `middlewares`: cross-cutting feature behavior

Shared infrastructure includes:

- environment validation
- Winston logging
- centralized error handling
- consistent API response helpers
- Helmet, CORS, compression, cookie parsing, and rate limiting

## Initial Delivery Scope

This initial scaffold intentionally establishes the platform instead of rushing domain logic. The first implemented API feature is health monitoring, and the first implemented frontend feature is the operations overview dashboard.

## Recommended Evolution Order

1. Authentication and session management
2. Role-based access control
3. Table and order lifecycle
4. Kitchen workflow and real-time updates
5. Billing, payments, reporting, and analytics
