# Aerojet Aviation Training Academy

EASA Part-66 Aviation Maintenance Training Portal — a multi-portal web application for managing students, courses, exams, and pool-based exam bookings.

## Portals

- **Staff/Admin** — User management, approvals, finance, reports
- **Applicant** — Registration, course purchase, payment upload
- **Student** — Dashboard, wallet, exam pools, grades, certificates
- **Instructor** — Classes, attendance, grading, schedule
- **Examiner** — Exam administration, results, question bank
- **Examiner** — Exam administration, results, question bank

## 📂 Documentation

All docs live under [`docs/`](./docs/) — start with the [docs index](./docs/README.md) or open the browsable [HTML index](./docs/html/index.html).

### Key resources
- **[Handover guide](./docs/guides/handover.md)** — start here for a new developer
- **[Architecture overview](./docs/architecture/system-overview.md)** + [database detail](./docs/architecture/database-detail.md) + [security model](./docs/architecture/security-model.md)
- **[Latest audit](./docs/audits/2026-05-21-final-audit.md)** — consolidated finding-by-finding cross-check (CRITICAL/HIGH all resolved)
- **[Compliance register](./docs/compliance/security-data-protection.md)** — ISO/IEC 27001 & Ghana Act 843 control mapping
- **[Known issues](./docs/audits/known-issues.md)** · **[Future roadmap](./docs/plans/future-plans.md)**

## Tech Stack

- **Framework:** Next.js 16 (App Router) · React 19
- **Language:** TypeScript
- **Database:** PostgreSQL (**Neon** - Primary, **Supabase** - Redundant Backup) + Prisma ORM
- **Auth:** NextAuth.js v4 + passkeys (WebAuthn) + TOTP 2FA
- **UI:** Tailwind CSS + shadcn/ui + Radix
- **Email:** Resend
- **Files:** UploadThing (primary) + Supabase Storage (mirror/replica)
- **Payments:** Manual (bank transfer) + Stripe (future, deferred)
- **Testing:** Vitest (unit/component) · Playwright (E2E) · Storybook (visual)
- **Storybook:** `bun run storybook` (port 6006)

## Getting Started

```bash
# Install dependencies
bun install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your credentials

# Generate Prisma client
bun run db:generate

# Push schema to database
bun run db:push

# Seed database
bun run db:seed

# Start dev server
bun dev
```

## Key Business Flows

1. **Registration → Activation:** Public register → Upload payment proof → Staff approves → Academy email + temp password issued
2. **Applicant → Student Promotion:** Purchase course → Staff approves enrollment → Role upgraded, Student ID + Wallet created
3. **Exam Pool Joining:** Student joins pool (€300 held) → Pool confirms when threshold (typically 25) is reached → Funds captured → Exam scheduled
4. **Wallet System:** Top-up request → Staff approves → Balance credited → Reserve on pool join → Capture on confirm / Release on fail

## Project Structure

See `FINAL_PROJECT_DIRECTORY_STRUCTURE.md` for the complete file tree.

## License

Proprietary — Aerojet Aviation Training Academy © 2026
