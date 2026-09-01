# Security Foundation

## Baseline Controls

- `helmet` is enabled in the API foundation.
- CORS is explicit and environment-driven.
- Request rate limiting is enabled at the API ingress layer.
- Request body sizes are capped.
- Request IDs are attached to every API response.
- Centralized error handling returns safe, non-secret-bearing payloads.
- Environment validation fails fast for invalid configuration.

## Exclusions for This Phase

- Authentication
- Authorization
- Secret rotation workflows
- Payment provider security controls
- Business-level RBAC enforcement
