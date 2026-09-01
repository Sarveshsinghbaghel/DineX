# Developer Guide

## Principles

- Follow the project constitution before introducing new code.
- Keep business logic out of controllers.
- Preserve folder structure and naming conventions.
- Prefer reusable abstractions only when duplication becomes real.

## Local Workflow

1. Install dependencies with `npm install`.
2. Configure environment files from the provided examples.
3. Run the backend and frontend in separate terminals.
4. Add new features inside their own feature modules.

## Frontend Feature Checklist

Each feature should include:

- `components`
- `pages`
- `hooks`
- `services`
- `types`
- `validation`
- `constants`

## Backend Feature Checklist

Each feature should include:

- `routes`
- `controllers`
- `services`
- `repositories`
- `models`
- `validators`
- `middlewares`
- `types`

## First Implementation Priority

Authentication should be the next prompt so RBAC, auditing, and protected workflows can be layered consistently across the platform.
