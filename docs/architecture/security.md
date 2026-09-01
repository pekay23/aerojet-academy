# Security Guidelines

## Authentication

- NextAuth.js with JWT strategy (8-hour sessions)
- Passwords hashed with bcryptjs (12 rounds)
- Force password change on first login for staff-created accounts
- Role-based middleware protecting all portal routes

## Authorization

- Role hierarchy: SUPER_ADMIN > ADMIN > STAFF > INSTRUCTOR > STUDENT > APPLICANT
- API routes validate session and role before processing
- Staff routes use `requireStaff()` helper from `lib/auth/helpers` for consistent auth
- Cron endpoints protected by `CRON_SECRET` bearer token (all GET and POST handlers)
- Wallet operations use serializable transactions to prevent race conditions

## Input Validation

- Zod schemas for all staff admin routes (charter, merge, proof, book-exam)
- Validation schemas centralized in `lib/validation/schemas.ts`
- `validateBody()` helper for consistent error formatting
- All API routes returning lists include `take` limits (never unbounded)

## Data Protection

- All database queries use parameterized Prisma queries (SQL injection safe)
- Input sanitization on all user-facing endpoints
- CSRF protection via NextAuth
- Wallet top-up uses Serializable transaction isolation to prevent race conditions

## Sensitive Data

- Never commit .env.local, .env.production
- API keys and secrets stored in environment variables only
- Payment proof URLs stored but files served through authenticated routes

## Exam Pool Security

- Serializable transaction isolation for pool joins
- SELECT FOR UPDATE to prevent double-joining
- Atomic increment of member count
- Auto-confirm/fail logic runs server-side only

## Two-Factor Authentication (2FA)

- TOTP-based 2FA available for STAFF, ADMIN, and SUPER_ADMIN accounts
- Uses `otplib` v13 (`generateSecret`, `generateURI`) for secret/URI generation only, with SHA-1 algorithm, 6 digits, 30-second period
- TOTP **verification** uses the custom `verifyTOTP()` from `lib/auth/totp.ts` (timing-safe, with replay protection), NOT otplib
- QR code generated server-side via `qrcode` package (data URI, never stored)
- Secret stored encrypted in `User.twoFactorSecret` field, enabled flag in `User.twoFactorEnabled`
- Login flow: credentials provider throws `2FA_REQUIRED` error string → client intercepts → shows TOTP input → re-authenticates with `totpCode` parameter
- Setup: `/api/auth/2fa/generate` → `/api/auth/2fa/verify` (enables on success)
- Disable: `/api/auth/2fa/disable` (requires valid TOTP code to confirm identity)
- All 2FA API routes require authenticated session with staff-level role

## Known Security Gaps (P3 backlog) — Resolved (2026-05-06)

The following P3 gaps identified in the May 2026 audits have been resolved:

- `api/auth/resend-verification` — ✅ Rate limited to 3/hour per IP ([lib/security/rate-limit.ts](../../lib/security/rate-limit.ts), [route.ts:12](../../app/api/auth/resend-verification/route.ts#L12)); uniform response prevents email enumeration ([route.ts:15-18,32-46](../../app/api/auth/resend-verification/route.ts#L15-L18))
- `api/public/submit-payment-proof` — ✅ Rate limited to 5/hour per IP ([lib/auth/helpers.ts](../../lib/auth/helpers.ts) `checkRateLimit`, [route.ts:11-12](../../app/api/public/submit-payment-proof/route.ts#L9-L12))
