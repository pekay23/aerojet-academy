---
name: aerojet-code-standards
description: "Apply when writing, reviewing, or refactoring code in the Aerojet Academy project. Enforces project-specific conventions: dual Prisma client pattern, role-based auth helpers, centralized business rules, EASA compliance requirements, audit logging format, email delivery logging, and portal-specific error/loading boundary rules."
disable-model-invocation: true
---

# Aerojet Academy Code Standards

Project-specific code standards for the Aerojet Academy aviation training portal. These rules extend the general `code-quality-standards` skill with Aerojet-specific conventions, file paths, and compliance requirements.

## 1. Prisma Dual-Client Pattern

**Rule:** Use `prismaUnfiltered` in all auth-gated routes. The `prismaBase as prisma` alias is only allowed in `lib/auth/helpers.ts`, `lib/auth/auth-options.ts`, and passkey routes.

```ts
// Correct in app/staff/, app/student/, app/instructor/, app/examiner/, app/applicant/
import { prismaUnfiltered } from '@/lib/prisma/client'

// Correct only in lib/auth/helpers.ts and passkey routes
import prisma from '@/lib/prisma/client'
```

**Rationale:** PostgreSQL RLS is not defined in the database. The RLS client adds transaction overhead with zero security benefit in auth-gated portals.

## 2. Auth Helper Hierarchy

**Rule:** Use the most specific auth helper available.

| Helper | Use For |
|--------|---------|
| `requireAdmin()` | SUPER_ADMIN only |
| `requireStaff()` | ADMIN, SUPER_ADMIN, STAFF |
| `requireInstructor()` | INSTRUCTOR role |
| `requireExaminer()` | EXAMINER role |
| `requireApplicant()` | APPLICANT role |
| `requireStudent()` | STUDENT role |
| `requireAuth()` | Any authenticated user |

```ts
// Correct
const user = await requireInstructor()

// Wrong
const session = await getAuthSession()
if (!session || session.user.role !== 'INSTRUCTOR') throw new Error('Unauthorized')
```

**Rationale:** Specific helpers reduce boilerplate and eliminate broken access control from forgotten role checks.

## 3. API Response Helpers

**Rule:** Use the standardized response helpers from `lib/api/response.ts`.

```ts
import { apiSuccess, apiError, apiPaginated, apiUnauthorized, apiForbidden, apiNotFound, withErrorHandler } from '@/lib/api/response'

export const GET = withErrorHandler(async (req, ctx) => {
  const session = await requireStaff()
  const data = await prismaUnfiltered.user.findMany()
  return apiSuccess(data)
})

export const POST = withErrorHandler(async (req, ctx) => {
  const body = await validateBody(req, createUserSchema)
  // ...
  return apiCreated(newUser)
})
```

**Rationale:** Consistent response shapes, automatic serialization, and standardized error codes (401/403/404/500).

## 4. Audit Logging Convention

**Rule:** Use `createAuditLog` from `lib/audit/logger.ts` for all privileged mutations. Pass `description` (string) and `changes` (object diff), NOT `metadata`.

```ts
import { createAuditLog, AuditAction } from '@/lib/audit/logger'

await createAuditLog({
  action: AuditAction.USER_ROLE_CHANGED,
  userId: actor.id,
  targetUserId: target.id,
  description: 'STUDENT → INSTRUCTOR',
  changes: { before: { role: 'STUDENT' }, after: { role: 'INSTRUCTOR' } },
})
```

**Rationale:** The `description`/`changes` convention enables human-readable audit trails and structured diff analysis.

## 5. Centralized Business Rules

**Rule:** All hardcoded business rules must live in `lib/constants/business-rules.ts`.

```ts
// lib/constants/business-rules.ts
export const ACADEMIC_RULES = {
  EASA_PASS_MARK: 75,
  GRADE_THRESHOLD_PASS: 75,
  GRADE_THRESHOLD_WARNING: 50,
  DEFAULT_MAX_CANDIDATES: 28,
  MAX_MODULES_PER_EVENT: 4,
}

export const POOL_DEFAULTS = {
  CONFIRM_THRESHOLD: 25,
  MAX_CANDIDATES: 28,
  SEAT_PRICE_EUR: 300,
  INDIVIDUAL_EXAM_FEE_EUR: 520,
  PAYMENT_DEADLINE_DAYS: 21,
}

export const WALLET_DEFAULTS = {
  CURRENCY: 'EUR',
  INITIAL_BALANCE: 0,
  RESIT_FEE_EUR: 150,
}

export const TIME_WINDOWS = {
  DSR_DAYS: 30,
  ATTENDANCE_THRESHOLD_PCT: 80,
  BUNDLE_EXPIRY_DAYS: 365,
  EXAM_CUTOFF_HOURS: 24,
  PAYMENT_VERIFICATION_DAYS: 2,
}

export const PATHWAY_PRICING = {
  FULL_TIME_4YEAR: { year1: 8500, total: 32000, name: 'EASA Part-66 Full-Time (4 Years)', years: 4 },
  FULL_TIME_2YEAR: { year1: 9500, total: 18000, name: 'EASA Part-66 Full-Time (2 Years)', years: 2 },
  MILITARY_1YEAR: { year1: 6500, total: 6500, name: 'Military Certification (1 Year)', years: 1 },
}
```

**Rationale:** Business rules change. Centralized constants prevent drift and enable runtime overrides via `SystemSetting`.

## 6. EASA Compliance Requirements

**Rule:** All EASA-specific features must follow Part-147/Part-145 conventions.

| Requirement | Implementation |
|-------------|----------------|
| Session types | THEORY / PRACTICAL / SIMULATOR with per-type thresholds |
| Grade immutability | `resultLocked` flag on `Grade` model; freeze once certificate issued |
| Practical training | `lockedAt`/`lockedBy` fields on `PracticalTrainingRecord` |
| Attendance evidence | Per-student, per-module attendance records |
| OJT tracking | Mentor-to-student ratio validation (145.147) |
| Certificate expiration | `expiresAt` tracking with automated reminder cron |

**Rationale:** Regulatory compliance is non-negotiable. These patterns ensure audit-ready records.

## 7. Email Delivery Logging

**Rule:** Every `sendEmail()` call must include `template` and `userId` for filterability.

```ts
await sendEmail({
  to: user.email,
  subject: 'Welcome to Aerojet Academy',
  html: renderWelcomeEmail(user),
  template: 'welcome',
  userId: user.id,
})
```

**Rationale:** Enables admins to filter delivery logs by template/user and diagnose failures.

## 8. Realtime Messaging

**Rule:** Use the existing `MessagesRealtime` component and `useRealtimeMessages` hook. The Supabase Realtime filter must use `recipientId=eq.<userId>` (camelCase).

```tsx
// Correct
<MessagesRealtime />

// Wrong - Supabase filter must use camelCase column name
.filter('recipient_id', 'eq', userId)
```

**Rationale:** Prisma keeps field names verbatim without `@map`. Using snake_case silently matches nothing.

## 9. Presence and Privacy

**Rule:** Use `<PresencePill>` for online indicators. Presence visibility follows `resolvePresenceForViewer()` rules.

```tsx
<PresencePill peerId={userId} />
```

**Rationale:** Batches presence fetches and respects `User.showLastSeen` privacy settings.

## 10. Storage and Image Proxy

**Rule:** All user-uploaded images must use `ProtectedImage` with `proxyImageUrl`.

```tsx
import { ProtectedImage } from '@/components/ProtectedImage'
import { proxyImageUrl } from '@/lib/storage/signed-url'

<ProtectedImage src={proxyImageUrl(url, 'profile-photos')} alt="Doc" width={400} height={300} />
```

**Rationale:** Provides right-click protection, drag prevention, and authenticated proxy through `/api/images/proxy`.

## 11. File Uploads

**Rule:** Use UploadThing via `UploadButton` or `UploadDropzone` from `lib/uploads/uploadthing.ts`. Never implement custom upload handlers.

**Rationale:** Centralized upload handling includes auth, virus scanning, and Supabase mirroring.

## 12. Cron Jobs

**Rule:** All cron jobs must:
1. Check `CRON_SECRET` header
2. Write a single `AuditLog` row when doing meaningful work
3. Be registered in `vercel.json`

```ts
export const GET = withErrorHandler(async (req) => {
  const secret = req.headers.get('x-cron-secret')
  if (secret !== process.env.CRON_SECRET) return apiUnauthorized()
  
  // Do work
  await createAuditLog({ action: AuditAction.CRON_RUN, description: 'Daily cleanup' })
  return apiSuccess({ ok: true })
})
```

**Rationale:** Cron audit logs provide run history visible to admins.

## 13. Portal Layout Conventions

**Rule:** Each portal must mount `<Heartbeat>` in its layout for presence tracking.

```tsx
// app/staff/layout.tsx
import { Heartbeat } from '@/components/shared/Heartbeat'

export default function StaffLayout({ children }) {
  return (
    <html>
      <body>
        <Heartbeat />
        {children}
      </body>
    </html>
  )
}
```

**Rationale:** Heartbeat pings `/api/me/heartbeat` every 30s to update `User.lastSeenAt`.

## 14. Error and Loading Boundary Standards

**Rule:** Follow this exact pattern for every route segment:

```
app/[portal]/
  error.tsx          # Named [Portal]Error (not StaffError, etc.)
  loading.tsx        # Named [Portal]Loading
  [feature]/
    page.tsx
    loading.tsx      # Required by CLAUDE.md
    error.tsx        # Required for high-risk segments
    [dynamic]/
      page.tsx
      loading.tsx    # Required
      error.tsx      # Required
      not-found.tsx  # Required for dynamic routes
```

**Rationale:** Consistent naming and coverage prevents copy-paste errors and ensures proper Suspense boundaries.

## 15. Serialization for Client Components

**Rule:** Use `serializePrisma()` for all server→client data handoffs. Convert `Decimal`→`number` and `Date`→ISO string.

```ts
const data = await prismaUnfiltered.course.findMany()
const serialized = serializePrisma(data)
// Pass serialized to client component
<ClientComponent data={serialized} />
```

**Rationale:** Prisma `Decimal` and `Date` types are not JSON-serializable and break client components.

## 16. Student/Applicant Portal Specifics

**Rule:** Student and Applicant pages use `prismaUnfiltered` with explicit `userId` filters rather than relying on RLS.

```ts
const enrollments = await prismaUnfiltered.enrollment.findMany({
  where: { userId: session.user.id },
})
```

**Rationale:** Defense-in-depth: explicit filters ensure users can only access their own data even if auth is bypassed.

## 17. Validation Schemas

**Rule:** All API route bodies must use Zod schemas from `lib/validation/schemas.ts`.

```ts
import { validateBody } from '@/lib/api/response'
import { createUserSchema } from '@/lib/validation/schemas'

export const POST = withErrorHandler(async (req) => {
  const data = await validateBody(req, createUserSchema)
  // ...
})
```

**Rationale:** Centralized validation prevents injection attacks and provides typed, documented API contracts.

## 18. Pagination Metadata

**Rule:** Use `apiPaginated` for all list endpoints. Never return raw arrays without pagination metadata.

```ts
const { page, limit, skip } = parsePagination(searchParams)
const [data, total] = await Promise.all([
  prismaUnfiltered.entity.findMany({ take: limit, skip }),
  prismaUnfiltered.entity.count(),
])
return apiPaginated(data, total, page, limit)
```

**Rationale:** Clients need total counts and current page info to render pagination controls.

## 19. Caching Reference Data

**Rule:** Use `unstable_cache` for rarely-changing reference data with 5-15min TTL.

```ts
import { unstable_cache } from 'next/cache'

export const getCourseCategories = unstable_cache(
  async () => {
    return prismaUnfiltered.courseCategory.findMany()
  },
  ['course-categories'],
  { revalidate: 900 }
)
```

**Rationale:** Reduces database load for data that changes infrequently.

## 20. No `window.location` in Client Components

**Rule:** Use `router.push()` or `router.refresh()` from `next/navigation`. Never use `window.location.reload()` or `window.location.href`.

```ts
// Correct
router.push('/dashboard')
router.refresh()

// Wrong
window.location.reload()
window.location.href = '/dashboard'
```

**Rationale:** Full page reloads lose React state and degrade UX. Navigation APIs preserve SPA behavior.

## 21. Test Suite Standards

**Rule:** Tests must catch real bugs, not create false confidence. Every test must assert specific values or response body shape.

### What NOT to test

| Pattern | Action |
|---------|--------|
| `expect(typeof fn).toBe('function')` | Delete — tests nothing |
| `expect(json).toBeDefined()` as sole assertion | Delete — weakest possible assertion |
| `expect([401, 403]).toContain(res.status)` | Delete — non-asserting |
| UI primitive smoke tests (`tests/components/ui/*`) | Delete — shadcn/ui doesn't need tests |
| Hook smoke tests (`tests/unit/hooks/*`) | Delete unless testing real logic |
| Auto-generated test scripts | Delete — produces theater, not value |
| Self-mocking components | Delete — tests mock, not component |
| Shadowing real implementations with mock wrappers | Delete — never catches real bugs |

### Required test patterns

1. **Assert specific values, not existence**
   ```ts
   // Correct
   expect(json.data[0].email).toBe('user@example.com')
   expect(json.meta.total).toBe(42)
   
   // Wrong
   expect(json).toBeDefined()
   ```

2. **Test edge cases and error paths**
   ```ts
   it('returns 403 when permission denied', async () => { ... })
   it('clamps negative balance to 0', () => { ... })
   ```

3. **Verify side effects with `toHaveBeenCalledWith`**
   ```ts
   expect(prismaMock.auditLog.create).toHaveBeenCalledWith({
     data: { action: 'USER_ROLE_CHANGED', userId: '1' }
   })
   ```

4. **Use `resetAllMocks()`, not `clearAllMocks()`**
   ```ts
   beforeEach(() => {
     vi.resetAllMocks()
   })
   ```

5. **Use shared mock configs from `tests/setup.tsx`**
   ```ts
   import { authHelpersMockDefaults, apiResponseMockDefaults } from '@/tests/setup'
   vi.mock('@/lib/auth/helpers', () => ({ ...authHelpersMockDefaults }))
   ```

6. **Test real implementation, not shadow mocks**
   ```ts
   // Correct — imports real withErrorHandler
   import { withErrorHandler } from '@/lib/api/response'
   
   // Wrong — reimplements withErrorHandler in test
   vi.mock('@/lib/api/response', () => ({
     withErrorHandler: vi.fn((fn) => async (req, ctx) => { ... })
   }))
   ```

### Test file structure

```
tests/
  unit/
    lib/
      audit-logger.test.ts          # Business logic
      rate-limit.test.ts            # Security logic
    utils/
      currency.test.ts              # Pure utilities
  integration/
    api/
      staff-users.test.ts           # Grouped by feature, NOT per-route
      student-exams.test.ts
    actions/
      staff-actions.test.ts
    workflows/
      registration.test.ts
  components/
    shared/
      DataTable.test.tsx            # Real UI interactions
      ProtectedImage.test.tsx       # Actual protection behaviors
    # NO tests/components/ui/ — shadcn/ui primitives don't need tests
  e2e/
    applicant-journey.spec.ts       # Real form submissions + data verification
```

### Test approval checklist

Before adding a new test file, verify:
- [ ] Asserts specific values or response body shape (not just existence)
- [ ] Tests business logic, not implementation details
- [ ] Tests edge cases or error paths
- [ ] Would fail if implementation was broken
- [ ] Not a UI primitive, hook smoke, or trivial `typeof` check
- [ ] Not auto-generated from a script
- [ ] Uses `resetAllMocks()` and shared mock configs
- [ ] Tests real implementation, not a shadow mock

**Reference**: `tests/STANDARDS.md` (Testing standards; §12 What NOT to test), `docs/plans/test-suite-remediation.md`

---

## Project-Specific File Paths

| Pattern | Location |
|---------|----------|
| Auth helpers | `lib/auth/helpers.ts` |
| Prisma clients | `lib/prisma/client.ts` |
| API response helpers | `lib/api/response.ts` |
| Validation schemas | `lib/validation/schemas.ts` |
| Business rules | `lib/constants/business-rules.ts` |
| Audit logging | `lib/audit/logger.ts` |
| Email sender | `lib/email/sender.ts` |
| Storage adapters | `lib/storage/` |
| Realtime client | `lib/realtime/client.ts` |
| Cached queries | `lib/cached-queries.ts` |
| Rate limiting | `lib/security/rate-limit.ts` |
| HTML sanitizer | `lib/utils/sanitize.ts` |
| Serialization | `lib/utils/serialization.ts` |
| Shared skeletons | `components/shared/DashboardSkeleton.tsx` |
| Protected images | `components/ProtectedImage.tsx` |
| Heartbeat | `components/shared/Heartbeat.tsx` |
| Presence pill | `components/shared/PresencePill.tsx` |
| Messages realtime | `components/shared/MessagesRealtime.tsx` |

## Verification Commands

```bash
bun run type-check   # npx tsc --noEmit
bun run lint         # ESLint
bun run test --run   # Vitest
bun run build        # Production build
```

## Audit Document Standards

When completing audit findings, update the portal audit document (`docs/audits/portal-audits/[portal]/`) with:

- **Status**: ✅ Fixed / ⚠️ Partial / ⏸️ Pending / 🔄 In Progress
- **Evidence**: File path and line number of the fix
- **Tests**: Which test files cover the change
- **Notes**: Any caveats or follow-up work needed
