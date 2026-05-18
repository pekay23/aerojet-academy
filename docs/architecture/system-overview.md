# System Architecture Overview

## Stack

- **Frontend:** Next.js 16 App Router, React 19, Tailwind CSS, shadcn/ui
- **Backend:** Next.js API Routes (serverless functions)
- **Database:** PostgreSQL (Neon) via Prisma ORM
- **Auth:** NextAuth.js v4 (JWT strategy)
- **Email:** Resend
- **Files:** UploadThing
- **Hosting:** Vercel (recommended)

## Portal Architecture

```
app/(public)/     → Marketing website (no auth)
app/(auth)/       → Login, register, password reset
app/(staff)/      → Admin portal (SUPER_ADMIN, ADMIN, STAFF)
app/(student)/    → Student portal (STUDENT)
app/(applicant)/  → Applicant portal (APPLICANT)
app/(instructor)/ → Instructor portal (INSTRUCTOR)
app/api/          → All API routes
```

## Key Design Decisions

1. **Route groups** for portal isolation — each has own layout, sidebar, error boundary
2. **Server-side auth** via middleware.ts — redirects unauthenticated/unauthorized users
3. **Serializable transactions** for exam pool joins — prevents race conditions
4. **Wallet reserve/capture** pattern — funds held, then captured or released
5. **Cron-based pool management** — automated checks for deadlines and confirmations
