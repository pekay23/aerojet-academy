# Security Model

## Middleware Chain
```
Request → middleware.ts
  → Check if public route → allow
  → Get JWT token
  → Check account status (SUSPENDED/DEACTIVATED → login)
  → Check mustChangePassword → redirect to change-password
  → Check role matches portal prefix → forbid or allow
```

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
