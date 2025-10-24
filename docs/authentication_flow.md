# Authentication Flow

This document describes the authentication flow used by SkillWise, including JWT access tokens, refresh tokens in HttpOnly cookies, and route protection.

## Overview

- Users authenticate via `/api/auth/login` or `/api/auth/register` (alias: `/api/auth/signup`).
- Backend issues:
  - `accessToken` (JWT), returned in JSON response
  - `refreshToken` stored server-side and also set as an HttpOnly cookie
- Frontend stores `accessToken` in memory/localStorage and attaches it as `Authorization: Bearer <token>`.
- When the access token expires, the app calls `/api/auth/refresh` (using HttpOnly cookie) to obtain a new access token.
- Logout revokes the refresh token server-side and clears the cookie.

## Sequence Diagram

```mermaid
sequenceDiagram
  autonumber
  participant U as User (Browser)
  participant FE as Frontend (React)
  participant BE as Backend (Express)
  participant DB as Database (PostgreSQL)

  U->>FE: Submit login form (email, password)
  FE->>BE: POST /api/auth/login
  BE->>DB: Verify user + password (bcrypt.compare)
  DB-->>BE: User OK
  BE-->>FE: { accessToken } + Set-Cookie: refreshToken (HttpOnly)
  FE->>FE: Store accessToken; set Authorization header

  U->>FE: Navigate to protected page
  FE->>BE: GET /api/protected (Authorization: Bearer accessToken)
  BE-->>FE: 200 OK (authorized)

  Note over FE,BE: Later, access token expires
  FE->>BE: POST /api/auth/refresh (with HttpOnly cookie)
  BE->>DB: Validate refresh token (not revoked, not expired)
  DB-->>BE: Valid
  BE-->>FE: { accessToken: new }
  FE->>FE: Update Authorization token

  U->>FE: Click Logout
  FE->>BE: POST /api/auth/logout
  BE->>DB: Revoke refresh token
  BE-->>FE: 200 OK + Clear-Cookie: refreshToken
  FE->>FE: Clear local tokens
```

## Error Handling

- Invalid credentials: `/auth/login` returns `400 { error: "Invalid email or password" }`
- Missing/invalid access token on protected routes: `401 { error: ... }`
- Expired/invalid refresh token: `/auth/refresh` returns `400 { error: "Invalid refresh token" }`

## Security Notes

- Refresh tokens are HttpOnly cookies to mitigate XSS token theft.
- CORS is configured with `credentials: true` and a strict `origin`.
- Passwords are hashed with bcrypt (configurable rounds via `BCRYPT_ROUNDS`).
- Rate limiting is enabled for the API.

## Environment

- `JWT_SECRET`, `JWT_REFRESH_SECRET`, `JWT_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN` control token behavior.
- `CORS_ORIGIN` must match the frontend origin (e.g., http://localhost:3000).
