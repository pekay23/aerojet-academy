# System Architecture Overview

## Stack

- **Frontend:** Next.js 16 App Router (React Server Components), React 19, Tailwind CSS v4, shadcn/ui + Radix
- **Backend:** Next.js API routes (serverless) + Server Actions
- **Database:** PostgreSQL (Neon, primary) via Prisma 7 ORM; Supabase as live replica
- **Auth:** NextAuth.js v4 (JWT strategy) + TOTP 2FA + WebAuthn passkeys
- **Email:** Resend
- **Files:** UploadThing (primary) mirrored nightly to Supabase storage
- **Hosting:** Vercel (production) with edge `proxy.ts` (Next 16 replacement for `middleware.ts`)

## Portal layout

Route groups handle public + auth flows; each role-portal is a top-level segment.

```
app/(auth)/       → Login, register, verify-email, password reset
app/(public)/     → Marketing site, course catalogue, news
app/staff/        → SUPER_ADMIN / ADMIN / STAFF portal
app/student/      → STUDENT portal
app/instructor/   → INSTRUCTOR portal
app/applicant/    → APPLICANT portal
app/examiner/     → EXAMINER portal
app/api/          → REST API + cron + UploadThing
```

## Auth enforcement (three layers)

1. **Edge proxy** at `proxy.ts` — `ROUTE_ROLE_MAP` gates every `/staff`, `/instructor`, `/student`, `/examiner`, `/applicant` page and their `/api/*` siblings. Wrong-role users are redirected to their own portal; unauthenticated users get `/login?callbackUrl=…` (pages) or 401 JSON (API).
2. **Portal layouts** — each portal `layout.tsx` calls `requireStaff` / `requireInstructor` / etc. from `lib/auth/helpers.ts` as a second check and to pass the session into the tree.
3. **Route handlers / server actions** — call `requireAdmin()` / `requireAuth()` directly; thrown `'Unauthorized'` / `'Forbidden'` is converted to 401 / 403 by `withErrorHandler`.

A missed check in any one layer is caught by the next.

## Prisma dual client

`lib/prisma/client.ts` exports two clients:

- `prisma` (default) — RLS-wrapped + soft-delete extension. Wraps every query in a transaction that sets PostgreSQL session vars (`aerojet.user_id`, `aerojet.user_role`) for row-level security. Used by student/applicant pages.
- `prismaUnfiltered` (named) — raw, no overhead. Used by staff pages, which are already auth-gated.

Adapter auto-selects per environment (Neon WS in dev, `pg` Pool in production).

## Key design decisions

1. **Route groups for auth/public flows** — `(auth)` and `(public)` keep the marketing site separate from the role-portals
2. **Per-portal layouts** carry breadcrumbs, sidebar, and a second auth check
3. **Serializable transactions** for exam pool joins — prevents race conditions on seat allocation
4. **Wallet reserve/capture pattern** — funds held when joining a pool, captured on confirmation or released on failure
5. **Cron-based lifecycle management** — see [deployment guide](../guides/deployment.md) for the 16 scheduled jobs
6. **Email-only password delivery** — bulk-import temp passwords go via Resend, never returned in the JSON API. Every send is logged to `EmailDelivery` and visible at *Settings → Email Delivery* with retry / failure history
7. **Logical replication Neon → Supabase** — see [the replication guide](../guides/neon-supabase-logical-replication.md). Supabase Realtime drives in-app messaging without a full page refresh
8. **Presence + privacy** — every authenticated tab heartbeats `User.lastSeenAt` every 30s via `<Heartbeat>` mounted in each portal layout. `lib/presence.ts:resolvePresenceForViewer()` enforces the visibility rules: green online dot for everyone, exact last-seen only to self / staff / opted-in peers. Admins can override per-user via `PATCH /api/staff/users/[id]/privacy`
