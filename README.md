# Aerojet Aviation Training Academy

EASA Part-66 Aviation Maintenance Training Portal — a multi-portal web application for managing students, courses, exams, and pool-based exam bookings.

## Portals

- **Staff/Admin** — User management, approvals, finance, reports
- **Applicant** — Registration, course purchase, payment upload
- **Student** — Dashboard, wallet, exam pools, grades, certificates
- **Instructor** — Classes, attendance, grading, schedule

## 📂 Documentation
For a detailed guide on the project's architecture, database, and recent implementations, please refer to the **[Developer Handover Guide](./docs/HANDOVER.md)**.

### Key Resources:
- **[Database & RLS Detail](./docs/DATABASE_DETAIL.md)**
- **[Architecture & Problem Solving](./docs/ARCHITECTURE_STRATEGIES.md)**
- **[Known Issues & Bugs](./docs/KNOWN_ISSUES.md)**
- **[Future Roadmap](./docs/future_plans.md)**

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Database:** PostgreSQL (**Neon** - Primary, **Supabase** - Redundant Backup) + Prisma ORM
- **Auth:** NextAuth.js v4
- **UI:** Tailwind CSS + shadcn/ui + Radix
- **Email:** Resend
- **Files:** UploadThing
- **Payments:** Manual (bank transfer) + Stripe (future)
- **Testing:** Vitest

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your credentials

# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed database
npm run db:seed

# Start dev server
npm run dev
```

## Key Business Flows

1. **Registration → Activation:** Public register → Upload payment proof → Staff approves → Academy email + temp password issued
2. **Applicant → Student Promotion:** Purchase course → Staff approves enrollment → Role upgraded, Student ID + Wallet created
3. **Exam Pool Joining:** Student joins pool (€300 held) → Pool auto-confirms at 25 members → Funds captured → Exam scheduled
4. **Wallet System:** Top-up request → Staff approves → Balance credited → Reserve on pool join → Capture on confirm / Release on fail

## Project Structure

See `FINAL_PROJECT_DIRECTORY_STRUCTURE.md` for the complete file tree.

## License

Proprietary — Aerojet Aviation Training Academy © 2026
