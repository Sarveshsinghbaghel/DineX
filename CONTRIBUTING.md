# Contributing to X10Think

## Working Agreements

1. Follow the approved architecture documents in `docs/`.
2. Keep changes scoped to the current phase or feature.
3. Prefer shared packages over cross-copying constants, types, or validation logic.
4. Preserve loading, empty, error, and accessibility states.
5. Never commit secrets, credentials, or production-only configuration.

## Development Flow

1. Install dependencies with `npm install`.
2. Copy the example environment files before starting services.
3. Run `npm run lint`, `npm run format:check`, `npm run typecheck`, and `npm run build` before opening a pull request.

## Branching

Use feature or fix branches from the `codex/` prefix unless the team agrees otherwise.

## Commit Convention

Use conventional commits such as `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, and `chore:`.

## Pull Requests

Every pull request should explain scope, architecture impact, and validation steps.
