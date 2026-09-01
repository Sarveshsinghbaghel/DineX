# Authentication And Identity

## Token lifecycle

Users register with a bcrypt-hashed password and must verify their email before login. Login issues a short-lived JWT access token in the response and a long-lived refresh JWT in an HttpOnly, SameSite cookie. Access tokens contain only `sub`, `sid`, `type`, `iat`, and `exp`.

Refresh requests verify the refresh JWT and server-side session, compare a SHA-256 hash of the presented token, then rotate the stored hash and issue a replacement cookie. A mismatch revokes the session and returns `AUTH_REFRESH_REUSED`. Logout revokes the session and clears the cookie.

## Password lifecycle

Passwords must be at least 12 characters and include upper- and lower-case letters, a number, and a symbol. Password reset and verification tokens are cryptographically random, hashed at rest, expire, and become one-time-use records. Password reset revokes all sessions; password change revokes other sessions.

## Sessions and security events

Sessions store the user, refresh-token hash, expiry, revocation time, last-use time, and limited request metadata. Failed logins use a generic response and lock the account after five failures for 15 minutes. Security logs contain event type and non-secret identifiers only. Passwords, JWTs, and one-time tokens are never logged.

## Configuration

`JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `ACCESS_TOKEN_TTL`, `REFRESH_TOKEN_TTL_DAYS`, `BCRYPT_ROUNDS`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, and `EMAIL_FROM` configure auth. Production secrets must be supplied through the environment and must not be committed.

## Endpoints

The auth API is mounted under `/api/v1/auth`: `register`, `login`, `refresh`, `logout`, `verify-email`, `resend-verification`, `forgot-password`, `reset-password`, `change-password`, and `me`. Authenticated requests use `Authorization: Bearer <access-token>`.

## Testing

Backend typechecking and build validation cover the auth source. Integration tests require MongoDB and SMTP test doubles; those services are not present in the current scaffold test command.
