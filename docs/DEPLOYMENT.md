# Deployment Guide

## Vercel (Recommended)
1. Push code to GitHub
2. Import project in Vercel
3. Set environment variables
4. Deploy

### Environment Variables for Production
- `DATABASE_URL` — Neon PostgreSQL connection string
- `NEXTAUTH_URL` — Production URL
- `NEXTAUTH_SECRET` — Generate with `openssl rand -base64 32`
- `RESEND_API_KEY` — For emails
- `UPLOADTHING_SECRET` — For file uploads
- `CRON_SECRET` — For cron job authentication

### Cron Jobs (Vercel)
Add to `vercel.json`:
```json
{ "crons": [
  { "path": "/api/cron/check-pools", "schedule": "0 6 * * *" },
  { "path": "/api/cron/check-events", "schedule": "0 */6 * * *" },
  { "path": "/api/cron/send-reminders", "schedule": "0 8 * * *" }
]}
```

## Database Migrations
```bash
npx prisma migrate deploy     # Apply migrations
npx prisma db push             # Push schema (dev)
```
