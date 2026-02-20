# Security Guidelines

## Authentication
- NextAuth.js with JWT strategy (8-hour sessions)
- Passwords hashed with bcrypt (12 rounds)
- Force password change on first login for staff-created accounts
- Role-based middleware protecting all portal routes

## Authorization
- Role hierarchy: SUPER_ADMIN > ADMIN > STAFF > INSTRUCTOR > STUDENT > APPLICANT
- API routes validate session and role before processing
- Wallet operations use serializable transactions to prevent race conditions

## Data Protection
- All database queries use parameterized Prisma queries (SQL injection safe)
- Input sanitization on all user-facing endpoints
- Rate limiting on auth and public endpoints
- CSRF protection via NextAuth

## Sensitive Data
- Never commit .env.local, .env.production
- API keys and secrets stored in environment variables only
- Payment proof URLs stored but files served through authenticated routes

## Exam Pool Security
- Serializable transaction isolation for pool joins
- SELECT FOR UPDATE to prevent double-joining
- Atomic increment of member count
- Auto-confirm/fail logic runs server-side only
