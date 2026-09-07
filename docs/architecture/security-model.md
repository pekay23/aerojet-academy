# Security Model

## Middleware Chain

```
Request → proxy.ts (edge proxy)
  → Gates /api/images/* only (auth + hotlink/header protection)
  → Sets image security headers
```

> **Note:** `proxy.ts` is **images-only**. It does NOT enforce portal role authentication. The proxy is a Next.js 16 replacement for `middleware.ts` and handles image security exclusively.

## Auth Enforcement (Three Layers)

1. **Portal layouts** — each portal `layout.tsx` calls `requireStaff` / `requireInstructor` / `requireStudent` / `requireApplicant` / `requireExaminer` from `lib/auth/helpers.ts` as the primary gate. Wrong-role users are redirected; unauthenticated users are sent to `/login`.
2. **Route handlers / server actions** — call `requireAdmin()` / `requireAuth()` / `requirePermission()` directly; thrown `'Unauthorized'` / `'Forbidden'` is converted to 401 / 403 by `withErrorHandler`.
3. **API route guards** — staff routes check `isStaff(role)` or `isAdmin(role)`; student routes verify `user.role === 'STUDENT'`; cron routes require `Authorization: Bearer ${CRON_SECRET}`.

A missed check in any one layer is caught by the next.

## Role-Based Access
| Portal | Allowed Roles |
|--------|--------------|
| /staff | SUPER_ADMIN, ADMIN, STAFF |
| /student | STUDENT |
| /applicant | APPLICANT |
| /instructor | INSTRUCTOR |

## API Security
- All API routes verify session via `getServerSession()`
- Staff routes check `isStaff(role)` or `isAdmin(role)`
- Student routes verify `user.role === 'STUDENT'`
- Cron routes require `Authorization: Bearer ${CRON_SECRET}`
- Webhooks verify signatures (Stripe) or tokens (UploadThing)

## Data Access Convention
- All portal code uses `prismaUnfiltered` for database queries
- The `prisma` default export (with RLS/soft-delete extensions) is not used by active portal code
- Row-level ownership is enforced via explicit `userId` filters in query `where` clauses, not via PostgreSQL RLS policies

## Pool Join Race Condition Prevention
```sql
BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;
SELECT * FROM "ExamPool" WHERE id = $1 FOR UPDATE;
-- Validate capacity, module diversity, wallet balance
-- Reserve funds
-- Create membership
-- Increment member count atomically
-- Auto-confirm if >= 25
COMMIT;
```
