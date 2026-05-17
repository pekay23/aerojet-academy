# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
Next.js 16 App Router aviation training academy portal with 5 role-based portals: Staff, Student, Instructor, Applicant, Examiner.
Prisma ORM, Neon PostgreSQL, NextAuth.js sessions, Vercel deployment. Package manager: **bun**.

## Common Commands
```bash
bun dev              # Start dev server (Next.js Turbopack)
bun run build        # Production build (requires .env)
bun run lint         # ESLint
bun run lint:fix     # ESLint auto-fix
bun run type-check   # npx tsc --noEmit
bun run format       # Prettier

# Testing
bun run test              # Vitest (unit/component)
bun run test:ui           # Vitest with browser UI
bun run test:e2e          # Playwright (Chromium only)
bun run test:e2e:all      # Playwright (all browsers, CI mode)

# Database
bun run db:generate       # prisma generate
bun run db:push           # prisma db push
bun run db:migrate        # prisma migrate dev
bun run db:studio         # prisma studio (GUI)
bun run db:seed           # seed from prisma/seed.ts
bun run db:seed:mock      # seed mock data
```

## Architecture

### Route Groups & Portals
```
app/
  (auth)/       — Login, register, verify-email, forgot/reset-password
  (public)/     — Marketing site, courses catalog, admissions, newsroom, contact
  staff/        — Admin/staff dashboard (SUPER_ADMIN, ADMIN, STAFF roles)
  student/      — Student portal
  instructor/   — Instructor portal
  applicant/    — Applicant forms & status tracking
  examiner/     — Exam administration
  api/          — REST API endpoints
```
Auth enforcement is layout-based (no centralized `middleware.ts`). Each portal layout checks the session role.

### Auth System
- **NextAuth.js** handles session management (JWT-based, credential provider)
- `lib/auth/auth-options.ts` — NextAuth config with email/password + TOTP 2FA
- `lib/auth/helpers.ts` — `getAuthSession()`, email verification, rate limiting
- `lib/auth/session-context.ts` — `getCachedSession()` for request-scoped caching
- `lib/auth/permissions.ts` — Role hierarchy: SUPER_ADMIN > ADMIN > STAFF > INSTRUCTOR > STUDENT > APPLICANT, plus granular DB-backed permissions
- `lib/auth/passkey-config.ts` — WebAuthn/passkey support via `@simplewebauthn`

### Prisma Dual-Client Pattern
Two Prisma clients exist in `lib/prisma/client.ts`:

- **`prisma`** (default export): Extended with RLS + soft-delete. Wraps every query in a transaction that sets PostgreSQL session variables (`aerojet.user_id`, `aerojet.user_role`) for row-level security policies. Uses `AsyncLocalStorage` for context.
- **`prismaUnfiltered`** (named export): Raw client, no RLS overhead. Use in staff pages.

The adapter (`lib/prisma/db-base.ts`) auto-selects: Neon WebSocket for dev, pg pool for production. Configurable via `AEROJET_LOCAL_DB_ADAPTER` env var.

### Key Shared Utilities
- `lib/utils/index.ts` — `cn()` (tailwind-merge), `formatCurrency()`, `formatDate()`, `generateRegistrationCode()`
- `lib/utils/serialization.ts` — `serializePrisma<T>()` converts Decimal→number, Date→ISO string for client components
- `lib/utils/constants.ts` — `APP_NAME`, `EXAM_FEE`, `PROGRAMMES`, `ROLES`, module lists, status groups
- `lib/api/response.ts` — `apiSuccess()`, `apiPaginated()`, `apiError()`, `apiUnauthorized()`, `withErrorHandler()`
- `lib/cached-queries.ts` — Cached reference data (course categories, license categories, academic years, semesters, exam components, active courses) with 5min TTL

### Testing
- **Unit/Component**: Vitest + jsdom, tests in `tests/`, setup in `tests/setup.ts`
- **E2E**: Playwright, tests in `tests/e2e/`, runs against `localhost:3000`

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
Rarely-changing data should be cached. Use existing helpers from `lib/cached-queries.ts`. Add new cached queries there when appropriate.

### 5. Use `next/dynamic` for heavy client components
Lazy-load components with large JS bundles (Recharts, TipTap, etc.):
```ts
import dynamic from 'next/dynamic'
const RevenueChart = dynamic(() => import('./RevenueChart'), { ssr: false })
```

### 6. Never load all rows to filter in JS
Do filtering/searching in SQL, not in application code.

### 7. Always paginate API responses
API routes returning lists must include `take` (and `skip` for paginated endpoints). Use `apiPaginated` from `lib/api/response.ts`.

### 8. Consolidate multiple queries for the same entity
If a page makes 2+ `findUnique` calls for the same record, merge them into one with all needed `select`/`include` fields.

## Code Conventions

### Imports
- Server components in `app/staff/` use `{ prismaUnfiltered }` from `@/lib/prisma/client`
- Toast notifications use `sonner` (NOT react-hot-toast)
- Date formatting: `date-fns` format function
- Serialization for client components: `serializePrisma()` from `@/lib/utils/serialization`
- **Client components**: Import `formatCurrency` from `@/lib/currency`, NOT from `@/lib/analytics/metrics` (which pulls in Prisma → `async_hooks` → build failure)

### otplib v5 (TOTP/2FA)
- Use named imports: `import { generateSecret, generateURI, verify } from 'otplib'`
- `verify()` returns `{ valid: boolean }`, NOT a plain boolean
- `generateURI()` requires lowercase `algorithm: 'sha1'` (not `'SHA1'`)
- The `authenticator` export does NOT exist in v5

### Prisma JSON Fields
- Filter JSON nulls with `Prisma.DbNull`, not `null`: `layout: { not: Prisma.DbNull }`
- Cast JSON values through `unknown`: `classroom.layout as unknown as LayoutData`

## Verification
Run `bun run type-check` to verify no type errors were introduced.
Pre-existing error in `dashboard/page.tsx` is known.
