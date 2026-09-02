# DineX Developer Onboarding & Local Development Guide

Welcome to **DineX**, an enterprise multi-tenant restaurant management platform built with React 19, Express 5, TypeScript, MongoDB Mongoose, and Socket.IO.

This onboarding guide provides clean-checkout setup steps to run the complete DineX monorepo locally.

---

## 1. Prerequisites

Ensure your development environment meets the following baseline requirements:

- **Node.js**: `>=22.12.0`
- **npm**: `>=10.9.0`
- **MongoDB**: Local MongoDB instance (`mongodb://localhost:27017`) or access to MongoDB Atlas cluster.
- **Git**: Installed and configured.

---

## 2. Repository Clone & Setup

```bash
# 1. Clone the repository
git clone https://github.com/DineX/DineX.git
cd DineX

# 2. Install workspace dependencies
npm install

# 3. Create local environment files from templates
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

---

## 3. Database Initialization & RBAC Seeding

DineX automatically initializes database connections on server start. To seed initial system roles and permissions:

```bash
npm run seed:rbac --workspace=@x10think/api
```

---

## 4. Development Execution Commands

Start development servers individually or together:

```bash
# Start Web Frontend (http://localhost:5173)
npm run dev:web

# Start API Backend (http://localhost:4000/api/v1)
npm run dev:api

# Start Background Worker
npm run dev:worker

# Start Docker Compose local stack (Web, API, Worker, MongoDB)
npm run dev:docker
```

---

## 5. Quality Verification Commands

Before committing code, verify type checking, linting, and tests pass across all workspace packages:

```bash
# Run strict TypeScript compilation check across monorepo
npm run typecheck

# Run ESLint check
npm run lint

# Run all 16 test suites (71 tests across API and Web)
npm test

# Build production bundles
npm run build
```

---

## 6. Monorepo Project Structure

```text
DineX/
├── apps/
│   ├── api/          # Express 5 backend server, Mongoose models, controllers, services
│   ├── web/          # React 19 + Vite frontend app, Tailwind CSS, TanStack Query
│   └── worker/       # Background worker runtime
├── packages/
│   ├── configuration/# Centralized app constants and config tokens
│   ├── constants/    # Business constants (roles, permissions, order statuses)
│   ├── types/        # Shared TypeScript interface definitions
│   ├── ui/           # Shared UI components
│   ├── utils/        # Utility helpers
│   └── validation/   # Zod validation schemas
├── docs/             # Technical architecture, API, and DB documentation
└── infrastructure/   # Dockerfiles and docker-compose configurations
```

---

## 7. Troubleshooting

- **Database Connection Failure**: Verify local MongoDB daemon is active (`mongod`) or test string `mongodb://localhost:27017/dinex-dev`.
- **Port Conflict (4000 or 5173 in use)**: Update `PORT` or `WEB_PORT` in your local `.env` file.
- **Typecheck Errors in `packages/*`**: Run `npm run build` once to compile shared package output declaration files.
