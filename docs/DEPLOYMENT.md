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

### Database Adapter — IMPORTANT
The project uses `@prisma/adapter-pg` with the standard `pg` PostgreSQL driver. **Do NOT switch to `@prisma/adapter-neon`** — the `ws` WebSocket module required by the Neon serverless adapter does not work in Vercel's Turbopack serverless bundles. See `docs/KNOWN_ISSUES.md` for details.

### Cron Jobs (Vercel)
Configured in `vercel.json`. All cron endpoints require `Authorization: Bearer <CRON_SECRET>` header:
```json
{ "crons": [
  { "path": "/api/cron/check-events", "schedule": "0 1 * * *" },
  { "path": "/api/cron/check-pools", "schedule": "0 2 * * *" },
  { "path": "/api/cron/milestone-reminders", "schedule": "0 9 * * *" },
  { "path": "/api/cron/send-reminders", "schedule": "0 10 * * *" },
  { "path": "/api/cron/payment-deadlines", "schedule": "0 3 * * *" },
  { "path": "/api/cron/backup", "schedule": "0 4 * * *" },
  { "path": "/api/cron/cleanup-audit-logs", "schedule": "0 0 1 * *" },
  { "path": "/api/cron/expire-bundles", "schedule": "0 0 * * *" },
  { "path": "/api/cron/cleanup-abandoned-accounts", "schedule": "0 5 * * *" }
]}
```

## Database Migrations
```bash
npx prisma migrate deploy     # Apply migrations
npx prisma db push             # Push schema (dev)
```
