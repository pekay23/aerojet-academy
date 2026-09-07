# Deployment Guide

## Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Set environment variables (see below)
4. Deploy

### Environment Variables for Production

- `DATABASE_URL` — Neon PostgreSQL **pooler** connection string (must be set for Production AND Development environments)
- `DIRECT_URL` — Neon direct connection string (used as fallback in dev)
- `NEXTAUTH_URL` — Production URL
- `NEXTAUTH_SECRET` — Generate with `openssl rand -base64 32`
- `RESEND_API_KEY` — For emails
- `UPLOADTHING_TOKEN` — For file uploads
- `CRON_SECRET` — For cron job authentication (required — all cron endpoints validate this)
- `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` — Payments
- `SUPABASE_DATABASE_URL` / `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` — Supabase mirror + Realtime
- `UPLOADTHING_SECRET` / `UPLOADTHING_APP_ID` — UploadThing dual credentials

### Database Adapter — IMPORTANT

The project uses `@prisma/adapter-pg` with the standard `pg` PostgreSQL driver. **Do NOT switch to `@prisma/adapter-neon`** — the `ws` WebSocket module required by the Neon serverless adapter does not work in Vercel's Turbopack serverless bundles. See `docs/audits/known-issues.md` for details.

Local exception: `next dev` may dynamically select the Neon adapter for `*.neon.tech` URLs to avoid local TCP connection stalls. Production and Vercel runtime must remain on `@prisma/adapter-pg`.

## Local Development Database

The deployed Vercel app must stay on `@prisma/adapter-pg` with the standard `pg` driver. For `next dev`, `lib/prisma/db-base.ts` keeps that production path untouched but uses a local-only Neon WebSocket adapter when the app is running in development against a `*.neon.tech` URL. This avoids the 60s TCP handshake hangs that can happen on some local networks while still preserving Prisma transaction support.

Local runtime connection priority:

1. `LOCAL_DATABASE_URL` if set, for a local Postgres database or a dedicated dev URL.
2. `DATABASE_URL`, normally the Neon pooler URL.
3. `DIRECT_URL`, only as a fallback.

Optional local overrides:

- `AEROJET_LOCAL_DB_ADAPTER=pg` forces the standard `pg` adapter in `next dev`.
- `AEROJET_LOCAL_DB_ADAPTER=neon` forces the local Neon adapter in `next dev`.
- `DB_CONNECT_TIMEOUT_MS=10000` changes the local TCP adapter's fail-fast timeout.

## Cron Jobs (Vercel)

All 17 cron endpoints are registered in `vercel.json` and require
`Authorization: Bearer <CRON_SECRET>`. Schedules are in `vercel.json`:

| Endpoint                               | Schedule (cron) | Purpose                                            |
| -------------------------------------- | --------------- | -------------------------------------------------- |
| `/api/cron/check-events`               | `0 1 * * *`     | Daily 01:00 — Update exam event statuses           |
| `/api/cron/check-pools`                | `0 2 * * *`     | Daily 02:00 — Fail expired exam pools              |
| `/api/cron/payment-deadlines`          | `0 3 * * *`     | Daily 03:00 — Mark overdue payments                |
| `/api/cron/backup`                     | `0 4 * * *`     | Daily 04:00 — Trigger DB backup                    |
| `/api/cron/sync-check`                 | `0 4 * * 1`     | Mondays 04:00 — Neon ↔ Supabase replication health |
| `/api/cron/supabase-mirror`            | `30 4 * * *`    | Daily 04:30 — Push pending writes to Supabase      |
| `/api/cron/cleanup-abandoned-accounts` | `0 5 * * *`     | Daily 05:00 — GDPR-style cleanup                   |
| `/api/cron/scheduled-reports`          | `0 8 * * 1`     | Mondays 08:00 — Scheduled analytics                |
| `/api/cron/milestone-reminders`        | `0 9 * * *`     | Daily 09:00 — Milestone T-7/T-1 reminders          |
| `/api/cron/renewal-reminders`        | `0 6 * * *`     | Daily 06:00 — Subscription & certificate renewal reminders |
| `/api/cron/renewal-reminders`        | `0 6 * * *`     | Daily 06:00 — Subscription & certificate renewal reminders |
| `/api/cron/send-reminders`             | `0 10 * * *`    | Daily 10:00 — Exam T-7/T-1 reminders               |
| `/api/cron/aptitude-reminders`         | `0 11 * * *`    | Daily 11:00 — Aptitude test reminders              |
| `/api/cron/interview-reminders`        | `0 12 * * *`    | Daily 12:00 — Interview reminders                  |
| `/api/cron/modular-deadlines`          | `0 13 * * *`    | Daily 13:00 — Modular deadline checks              |
| `/api/cron/expire-bundles`             | `0 0 * * *`     | Daily 00:00 — Expire exam bundles                  |
| `/api/cron/cleanup-audit-logs`         | `0 0 1 * *`     | 1st of month 00:00 — Retention sweep               |
| `/api/cron/gdpr-retention`             | `0 3 * * 1`     | Mondays 03:00 — Data retention sweep               |

## Database Migrations

```bash
bunx prisma migrate deploy     # Apply migrations
bunx prisma db push             # Push schema (dev)
bunx prisma generate            # Regenerate client after schema edits
```

Post-push, the `postdb:push` npm script mirrors the schema to Supabase via
`scripts/sync-supabase-schema.mjs` (skipped automatically if
`SUPABASE_DATABASE_URL` isn't set).

## Supabase mirror

- `bunx prisma db push` (Neon) is the source of truth.
- `scripts/sync-supabase-schema.mjs` runs as `postdb:push` and applies the
  same Prisma schema to Supabase.
- `scripts/sync-data-to-supabase.mjs` is the one-time data backfill.
- Logical replication (Neon → Supabase) is documented in
  `docs/guides/neon-supabase-logical-replication.md`.

## Files / uploads

`UploadThing` is the primary file store; `supabase-mirror` keeps a copy in
Supabase storage nightly.

## Reverse proxy / middleware

`proxy.ts` at the repo root is **images-only** — it gates `/api/images/*`
(auth + hotlink/header protection) and sets image security headers. It does
**not** enforce portal auth for `/staff`, `/instructor`, `/student`,
`/examiner`, `/applicant`, or their `/api/*` siblings.

Portal auth is enforced in three layers:

1. **Portal layouts** — each portal's `layout.tsx` calls
   `requireStaff`/`requireInstructor`/`requireStudent`/etc. from
   `lib/auth/helpers.ts` as the primary gate.
2. **Route handlers / server actions** — call `requireAdmin()`/`requireAuth()`
   /`requireStaff()`/`requirePermission()` directly; thrown `'Unauthorized'`/
   `'Forbidden'` strings are caught by `withErrorHandler` and converted to
   401/403.
3. **Edge proxy** (`proxy.ts`) — images-only; does not gate portal routes.

## Webhooks

- `POST /api/webhooks/resend` — Resend email events
- `POST /api/webhooks/stripe` — Stripe payment events
- `POST /api/webhooks/uploadthing` — UploadThing events

## Smoke test after deploy

```bash
curl https://your-domain.example/api/health
# 200 OK + a JSON body
```
