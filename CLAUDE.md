# Aerojet Academy — Agent Guidelines

## Project Overview
Next.js 16 App Router aviation training academy portal with 3 portals: Staff, Student, Applicant.
Prisma ORM, Neon PostgreSQL, Supabase Auth, Vercel deployment.

## Performance Conventions (MUST FOLLOW)

### 1. Always use `prismaUnfiltered` in staff pages
Staff pages are already auth-gated. The RLS client (`prisma`) wraps every query in a transaction with `set_config()` — unnecessary overhead for staff/admin roles.
```ts
// CORRECT
import { prismaUnfiltered } from '@/lib/prisma/client'
// WRONG — adds transaction overhead for no benefit
import prisma from '@/lib/prisma/client'
```
Exception: Student/applicant-facing pages that need RLS enforcement should still use `prisma`.

### 2. Parallelize independent queries with Promise.all
Never write sequential `await` calls for independent queries. Always use `Promise.all`.
```ts
// CORRECT
const [users, courses, events] = await Promise.all([
  prismaUnfiltered.user.findMany(...),
  prismaUnfiltered.course.findMany(...),
  prismaUnfiltered.examEvent.findMany(...),
])

// WRONG — 3x slower
const users = await prismaUnfiltered.user.findMany(...)
const courses = await prismaUnfiltered.course.findMany(...)
const events = await prismaUnfiltered.examEvent.findMany(...)
```

### 3. Every page directory MUST have a `loading.tsx`
Every route segment with a `page.tsx` that fetches data server-side must have a `loading.tsx` for Suspense streaming. Pattern:
```tsx
import { TableSkeleton } from '@/components/shared/DashboardSkeleton'
export default function Loading() {
  return <TableSkeleton rows={10} />
}
```

### 4. Use `unstable_cache` for reference data
Rarely-changing data should be cached. Use existing helpers from `lib/cached-queries.ts`:
- `getCachedCourseCategories()` — 5min TTL
- `getCachedLicenseCategories()` — 5min TTL
- `getCachedAcademicYears()` — 5min TTL
- `getCachedSemesters()` — 5min TTL
- `getCachedExamComponents()` — 5min TTL
- `getCachedActiveCourses()` — 5min TTL

Add new cached queries to `lib/cached-queries.ts` when appropriate.

### 5. Use `next/dynamic` for heavy client components
Lazy-load components with large JS bundles (Recharts, TipTap, etc.):
```ts
import dynamic from 'next/dynamic'
const RevenueChart = dynamic(() => import('./RevenueChart'), { ssr: false })
```

### 6. Never load all rows to filter in JS
Do filtering/searching in SQL, not in application code.
```ts
// WRONG — loads ALL users into memory
const all = await prisma.user.findMany({ select: { id: true, ... } })
const match = all.find(u => slugify(u.name) === slug)

// CORRECT — filter in SQL
const match = await prismaUnfiltered.$queryRaw`SELECT id FROM users WHERE ... LIMIT 1`
```

### 7. Always paginate API responses
API routes returning lists must include `take` (and `skip` for paginated endpoints). Never return unbounded queries.
```ts
// Use the shared apiPaginated helper
import { apiPaginated } from '@/lib/api/response'
```

### 8. Consolidate multiple queries for the same entity
If a page makes 2+ `findUnique` calls for the same record, merge them into one with all needed `select`/`include` fields.

## Code Conventions

### Imports
- Server components in `app/staff/` use `{ prismaUnfiltered }` from `@/lib/prisma/client`
- Toast notifications use `sonner` (NOT react-hot-toast)
- Date formatting: `date-fns` format function
- Serialization for client components: `serializePrisma()` from `@/lib/utils/serialization`
- **Client components**: Import `formatCurrency` from `@/lib/currency`, NOT from `@/lib/analytics/metrics` (which pulls in Prisma → `async_hooks` → build failure)

### API Response Helpers
Located in `lib/api/response.ts`:
- `apiSuccess(data)` — 200 response
- `apiPaginated(data, total, page, limit)` — paginated response
- `apiError(message, status?)` — error response
- `apiUnauthorized()` — 401 response
- `withErrorHandler(handler)` — wraps route with try/catch

### Auth
- `getAuthSession()` from `@/lib/auth/helpers` — returns session or null
- `requireAdmin()` — throws if not admin
- `getCachedSession()` from `@/lib/auth/session-context` — request-scoped cached session

### otplib v5 (TOTP/2FA)
- Use named imports: `import { generateSecret, generateURI, verify } from 'otplib'`
- `verify()` returns `{ valid: boolean }`, NOT a plain boolean
- `generateURI()` requires lowercase `algorithm: 'sha1'` (not `'SHA1'`)
- The `authenticator` export does NOT exist in v5

### Prisma JSON Fields
- Filter JSON nulls with `Prisma.DbNull`, not `null`: `layout: { not: Prisma.DbNull }`
- Cast JSON values through `unknown`: `classroom.layout as unknown as LayoutData`

### File Structure
- `app/staff/_components/` — shared staff portal components
- `app/staff/actions.ts` — server actions for staff portal
- `app/staff/classrooms/[id]/_components/FloorPlanDesigner.tsx` — interactive floor plan builder
- `app/staff/classes/[id]/seating/` — class seating assignment
- `app/staff/exams/sittings/[id]/seating/` — exam seating assignment
- `app/student/seating/page.tsx` — student seating view (class + exam)
- `app/student/classmates/` — classmate directory with 6 filter modes
- `app/api/auth/2fa/` — 2FA generate/verify/disable endpoints
- `app/staff/settings/_components/TwoFactorSettings.tsx` — 2FA setup UI
- `components/Tour/AppTour.tsx` — role-specific welcome tour (react-joyride)
- `lib/cached-queries.ts` — cached reference data queries
- `lib/settings.ts` — system settings with caching
- `components/shared/DashboardSkeleton.tsx` — skeleton components for loading states

## Testing After Changes
Run `npx tsc --noEmit` to verify no type errors were introduced.
Pre-existing error in `dashboard/page.tsx` is known. AppTour.tsx errors are resolved (v1.5.0).
