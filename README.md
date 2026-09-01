# X10Think Restaurant Management System

X10Think is an enterprise restaurant operations platform being built as a documentation-first monorepo. This phase establishes the repository architecture, shared packages, development environment, CI foundation, Docker development workflow, and minimal application bootstraps for the web app, API, and background worker.

## Project Overview

- `apps/web` contains the React, Vite, TypeScript, and Tailwind frontend foundation.
- `apps/api` contains the Express, TypeScript, MongoDB-ready backend foundation with `/api/v1/health`.
- `apps/worker` contains the background worker runtime reserved for future async processing.
- `packages/*` contains shared constants, configuration, types, validation helpers, utilities, and reserved UI package space.
- `docs/` contains the approved architecture references plus structured guidance for security, deployment, testing, and development workflow.

## Architecture

The repository follows a monorepo design with explicit separation between user-facing applications, shared packages, documentation, automation scripts, and infrastructure assets. Frontend code never talks directly to the database. Backend routing stays thin and delegates behavior to services and repositories. Shared packages are reserved for cross-application contracts so future modules can grow without copy-paste drift.

## Technology Stack

- Frontend: React 19, Vite 7, TypeScript, Tailwind CSS, TanStack Query, React Router
- Backend: Express 5, TypeScript, Zod, Winston, Mongoose
- Worker: TypeScript, TSX, Winston, Zod
- Tooling: npm workspaces, ESLint, Prettier, EditorConfig, GitHub Actions, Docker Compose

## Repository Structure

```text
apps/
  api/
  web/
  worker/
packages/
  configuration/
  constants/
  types/
  ui/
  utils/
  validation/
docs/
infrastructure/
scripts/
.github/
```

## Prerequisites

- Node.js `>=22.12.0`
- npm `>=10.9.0`
- Docker Desktop or compatible Docker runtime for containerized development
- Local MongoDB or access to MongoDB Atlas for API and worker data connectivity

## Installation

1. Run `npm install`.
2. Copy the environment templates:
   - `cp .env.example .env`
   - `cp apps/api/.env.example apps/api/.env`
   - `cp apps/web/.env.example apps/web/.env`
   - `cp apps/worker/.env.example apps/worker/.env`
3. Optionally run `npm run prepare` if Git hooks were not installed automatically.

## Environment Setup

Environment templates are intentionally secret-free. Use them to define local and CI-safe defaults only. Required variable documentation lives in [docs/deployment/environment-variables.md](/Users/sarveshsinghbaghel/Documents/Resturent/docs/deployment/environment-variables.md).

## Development Commands

- `npm run dev:web` starts the frontend foundation.
- `npm run dev:api` starts the API foundation.
- `npm run dev:worker` starts the background worker foundation.
- `npm run dev:docker` starts the Docker Compose development stack.
- `npm run build` builds all workspaces.
- `npm run typecheck` runs strict TypeScript checks across the monorepo.
- `npm run lint` runs ESLint across the monorepo.
- `npm run format:check` verifies formatting with Prettier.
- `npm run test` runs placeholder workspace test commands.

## Docker Usage

Use `npm run dev:docker` or `docker compose -f infrastructure/compose/docker-compose.dev.yml up --build`. The development stack includes the web app, API, worker, and a local MongoDB service. Docker assets live under [infrastructure/docker](/Users/sarveshsinghbaghel/Documents/Resturent/infrastructure/docker) and [infrastructure/compose](/Users/sarveshsinghbaghel/Documents/Resturent/infrastructure/compose).

## Testing, Linting, and Build Verification

This foundation phase treats type checking, linting, formatting, and successful builds as the baseline quality gate. Future business modules must extend that gate with real unit, integration, and end-to-end tests.

## Contribution Rules

Follow [CONTRIBUTING.md](/Users/sarveshsinghbaghel/Documents/Resturent/CONTRIBUTING.md), the approved documents in `docs/`, and the repository branching and commit guidance in the guides directory before opening pull requests.

## Git Workflow

- Branch prefix: `codex/`
- Commit style: conventional commits
- Pull requests must include validation evidence and architecture impact summary

## Documentation Links

- [Software Requirements Specification](/Users/sarveshsinghbaghel/Documents/Resturent/docs/software-requirements-specification.md)
- [Software Design Document](/Users/sarveshsinghbaghel/Documents/Resturent/docs/software-design-document.md)
- [Database Design Document](/Users/sarveshsinghbaghel/Documents/Resturent/docs/database-design-document.md)
- [API Design Document](/Users/sarveshsinghbaghel/Documents/Resturent/docs/api-design-document.md)
- [UI/UX Design Blueprint](/Users/sarveshsinghbaghel/Documents/Resturent/docs/ui-ux-design-system-and-experience-blueprint.md)
- [Branching Strategy Guide](/Users/sarveshsinghbaghel/Documents/Resturent/docs/guides/branching-strategy.md)
- [Commit Conventions Guide](/Users/sarveshsinghbaghel/Documents/Resturent/docs/guides/commit-conventions.md)
