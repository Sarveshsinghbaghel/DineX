# Testing Guide

## Testing Targets

- Unit tests for services, utilities, and validators
- Integration tests for API routes and repositories
- Component tests for reusable UI and feature pages
- End-to-end tests for core restaurant workflows

## Recommended Tooling

- Backend: Vitest or Jest with Supertest
- Frontend: Vitest with React Testing Library
- E2E: Playwright

## Immediate Next Tests

1. Health service contract test
2. Environment validation tests
3. Dashboard module rendering test
4. Router smoke test

## Quality Gate

Every new feature should ship with at least:

- one validation test
- one service or integration test
- one UI or API behavior test depending on the feature surface
