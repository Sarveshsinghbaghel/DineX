# API Guide

## Base URL

`/api/v1`

## Response Envelope

Successful responses use this structure:

```json
{
  "success": true,
  "message": "Request completed successfully.",
  "data": {},
  "meta": {}
}
```

Error responses use this structure:

```json
{
  "success": false,
  "message": "Human-readable message",
  "error": {
    "code": "ERROR_CODE",
    "details": {}
  }
}
```

## Implemented Endpoints

### `GET /api/v1/health`

Returns service health details including:

- application name
- environment
- uptime
- timestamp
- database connectivity state
- memory usage

### `GET /`

Simple API root endpoint for smoke checks.

## Future API Standards

- All feature routes should be mounted under `/api/v1/<feature>`.
- Controllers must remain thin and delegate business logic to services.
- Request validation should happen before service execution.
- Pagination, filtering, sorting, and searching should use a consistent query contract.
