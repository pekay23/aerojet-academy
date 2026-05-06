# Security Guidelines

## Authentication
- NextAuth.js with JWT strategy (8-hour sessions)
- Passwords hashed with bcrypt (12 rounds)
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

## Known Security Gaps (P3 backlog)
- `api/auth/resend-verification` — No rate limiting, possible email enumeration
- `api/public/submit-payment-proof` — No rate limiting, registration code could be brute-forced
