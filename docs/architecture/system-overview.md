# System Architecture Overview

## Stack

- **Frontend:** Next.js 16 App Router (React Server Components), React 19, Tailwind CSS v4, shadcn/ui + Radix
- **Backend:** Next.js API routes (serverless) + Server Actions
- **Database:** PostgreSQL (Neon, primary) via Prisma 7 ORM; Supabase as live replica
- **Auth:** NextAuth.js v4 (JWT strategy) + TOTP 2FA + WebAuthn passkeys
- **Email:** Resend
- **Files:** UploadThing (primary) mirrored nightly to Supabase storage. Image proxy system at `lib/storage/proxy.ts` + `app/api/images/proxy` and `app/api/images/transform` routes with sharp-based transformation.
- **Hosting:** Vercel (production) with edge `proxy.ts` (Next 16 replacement for `middleware.ts`)

## Portal layout

Route groups handle public + auth flows; each role-portal is a top-level segment.

```
app/(auth)/       → Login, register, verify-email, password reset
app/(public)/     → Marketing site, course catalogue, newsroom
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

- `prisma` (default) — Extended with soft-delete and RLS extensions. Legacy; not used by active portal code.
- `prismaUnfiltered` (named) — Raw base client with no RLS overhead. Used by all portals for direct queries.

Adapter auto-selects per environment (Neon WS in dev, `pg` Pool in production).

## Key design decisions

1. **Route groups for auth/public flows** — `(auth)` and `(public)` keep the marketing site separate from the role-portals
2. **Per-portal layouts** carry breadcrumbs, sidebar, and a second auth check
3. **Image proxy with storage adapter abstraction** — Auth-gated image serving through two API routes (`/api/images/proxy` and `/api/images/transform`). A `StorageAdapter` interface decouples image fetching from the provider (HTTP currently, S3/R2 ready). Client-side `proxyImageUrl()` / `transformImageUrl()` helpers build proxied URLs; `<ProtectedImage>` renders them with hotlink protection. Scope-based access control restricts images by role and ownership.
4. **Newsroom** — Public blog/press release system at `/newsroom` with paginated listing, dynamic article detail pages with full SEO metadata (Open Graph, Twitter Cards, JSON-LD), and staff-only create/edit interfaces. Articles support cover images, tags, custom author attribution, and read-time calculation.
5. **Serializable transactions** for exam pool joins — prevents race conditions on seat allocation
6. **Wallet reserve/capture pattern** — funds held when joining a pool, captured on confirmation or released on failure
7. **Cron-based lifecycle management** — see [deployment guide](../guides/deployment.md) for the 16 scheduled jobs
8. **Email-only password delivery** — bulk-import temp passwords go via Resend, never returned in the JSON API. Every send is logged to `EmailDelivery` and visible at _Settings → Email Delivery_ with retry / failure history
9. **Logical replication Neon → Supabase** — see [the replication guide](../guides/neon-supabase-logical-replication.md). Supabase Realtime drives in-app messaging without a full page refresh
10. **Presence + privacy** — every authenticated tab heartbeats `User.lastSeenAt` every 30s via `<Heartbeat>` mounted in each portal layout. `lib/presence.ts:resolvePresenceForViewer()` enforces the visibility rules: green online dot for everyone, exact last-seen only to self / staff / opted-in peers. Admins can override per-user via `PATCH /api/staff/users/[id]/privacy`
