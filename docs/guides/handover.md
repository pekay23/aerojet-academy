# Developer Handover Documentation

This document provides a comprehensive guide for developers taking over the Aerojet Academy portal. It covers recent implementations, architectural decisions, and known challenges.

## 🚀 Quick Links

- [Database & RLS Detail](../architecture/database-detail.md)
- [Architecture & Problem Solving](../architecture/strategies.md)
- [Known Issues & Pending Fixes](../audits/known-issues.md)
- [Future Roadmap](../plans/future-plans.md)

---

## 🏗️ Technical Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript (Strict Mode)
- **Database**: PostgreSQL (**Neon** as Primary, **Supabase** as Redundant/Backup)
- **ORM**: Prisma
- **Styling**: Tailwind CSS + Shadcn UI
- **Auth**: NextAuth.js + TOTP 2FA (otplib v13)
- **File Storage**: UploadThing

---

## 💎 Recently Implemented Features

### 1. Staff Analytics Dashboard (`/staff/reports`)

- **Tabbed Analytics**: Overview, Enrollment, Revenue, Pools, Attendance, Exams, and Year-on-Year.
- **Timeframe Filtering**: Supports granular periods (1h, 4h, 24h, 7d, 30d, custom).
- **Dynamic Charts**: Powered by Recharts with responsive container sizing.
- **Key Files**:
  - `app/staff/reports/page.tsx`
  - `lib/analytics/reports.ts`
  - `lib/analytics/metrics.ts`

### 2. Two-Factor Authentication (`/staff/settings` → Security tab)

- TOTP-based 2FA for staff/admin accounts using `otplib` v13.
- QR code enrollment, 6-digit verification, disable with confirmation.
- Login flow intercepts `2FA_REQUIRED` error to show TOTP input.
- **Key Files**:
  - `app/api/auth/2fa/generate/route.ts`, `verify/route.ts`, `disable/route.ts`
  - `app/staff/settings/_components/TwoFactorSettings.tsx`
  - `lib/auth/auth-options.ts` (credentials provider 2FA logic)
  - `app/(auth)/login/_components/LoginForm.tsx` (TOTP input)

### 3. Interactive Floor Plan & Seating System

- **Floor Plan Designer** (`/staff/classrooms/[id]`): CSS grid builder with DESK/AISLE/OBSTACLE tools, paint-drag, auto-labeling, grid resize.
- **Exam Seating** (`/staff/exams/sittings/[id]/seating`): Drag-and-drop student→seat assignment.
- **Class Seating** (`/staff/classes/[id]/seating`): Same interface, stored in SystemSettings JSON.
- **Student View** (`/student/seating`): Mini floor plans showing assigned seats for classes and exams.
- **Key Files**:
  - `app/staff/classrooms/[id]/_components/FloorPlanDesigner.tsx`
  - `app/staff/classrooms/[id]/page.tsx`
  - `app/staff/exams/sittings/[id]/seating/` (page + SeatingAssignment component)
  - `app/staff/classes/[id]/seating/` (page + ClassSeatingAssignment component)
  - `app/student/seating/page.tsx`

### 4. Enhanced Classmates Directory (`/student/classmates`)

- 6 filter modes: batch, classmates, year, semester, pathway, class.
- Sub-filter badges for each dimension. Search by name or email.
- **Key Files**:
  - `app/student/classmates/page.tsx`
  - `app/student/classmates/_components/ClassmatesFilters.tsx`

### 5. Admissions Pipeline & Internal Exams

- Admissions pipeline models, applicant stages, document uploads, aptitude testing, shortlisting, interviews, medical review, legacy import, and internal exams are scaffolded in `prisma/schema.prisma` and documented in `docs/plans/admissions-pipeline.md`.
- Internal exams are feature-flagged by `internal_exam_system_enabled`.
- Staff manage exam banks at `/staff/exams/internal`; expanded bank rows include pool health, rules, and a copyable student-facing link.
- Students use `/student/exams/internal`; the dashboard only lists exam banks for enrolled courses, requires candidate-detail confirmation before starting, supports skip/review navigation, autosaves answers, and confirms submission.
- **Anti-Cheat & Lockdown**: Keyboard anti-cheat is enforced in the live exam UI (`allowKeyboardAutoSubmit`), along with a mandatory Fullscreen API prompt, tab-switching detection (`visibilitychange`), and CSS-based sidebar/header suppression (`.exam-lockdown`) to secure the exam environment.
- **Pass/Fail Grading System**: Grades across the portal are mapped to an EASA-compliant Pass/Fail system (Pass ≥ 75%).
- **Key Files**:
  - `app/staff/exams/internal/_components/ExamBankManager.tsx`
  - `app/student/exams/internal/_components/InternalExamDashboard.tsx`
  - `app/student/exams/internal/_components/InternalExamInterface.tsx`
  - `app/api/student/exams/internal/{progress,start,session,answer,submit}/route.ts`
  - `lib/internal-exam/engine.ts`

### 6. Dynamic System Settings & GDPR Compliance

- **System Settings**: Staff can manage configuration dynamically via the API and React forms in the settings portal, automatically capturing and parsing boolean toggles.
- **GDPR Engine**: An automated sweep service and retention policy engine have been added to manage historical user data in compliance with GDPR.
- **Key Files**:
  - `app/api/settings/route.ts`
  - `components/settings/SystemSettingsForm.tsx` (or equivalent)
  - `lib/gdpr/` (if applicable)

### 7. CI/CD & Production Deployments

- The CI pipeline standardizes on **Bun** for test environment execution, minimizing deployment inconsistencies.
- **Pre-Migration Scripts**: Added hooks to automatically clear stale Postgres advisory locks and terminate active connections on Vercel deployments, preventing frozen schema migrations.
- **Key Files**:
  - `.github/workflows/production.yml`
  - `scripts/clear-locks.ts`, `scripts/terminate-connections.ts`

---

## 🔒 Security & Data Access

### Prisma Dual-Client Setup

The application uses a primary database on Neon with Supabase as a redundant backup.

- **Strategy**: Security is enforced at the application level via route guards and explicit query filters. The codebase previously included RLS scaffolding, but **no PostgreSQL RLS policies are currently defined**.
- **Current convention**: All portal code uses `prismaUnfiltered` (the raw Prisma client) for database queries. The `prisma` default export includes soft-delete and RLS extensions but is not used by active portal code.
- **Legacy scaffolding**: `lib/prisma/rls-hardened.ts` and `lib/prisma/soft-delete-extension.ts` remain in place for potential future use.

---

## 🛠️ Maintenance & Common Tasks

### Versioning & Changelog Automation

The project uses **release-it** with per-branch conventional commits (see `scripts/release.mjs`) for versioning and changelog generation.

- **Pre-commit hook**: runs `lint-staged` only (Prettier on staged `*.{ts,tsx,js,json,md,css}` files). It does **not** handle versioning.
- **Version bumps**: driven by `release-it` based on conventional commit messages merged to `main`/`staging`.
- **Changelog**: auto-generated by `release-it` from commit history.

### Database Migrations

1. Modify `prisma/schema.prisma`.
2. Run `bun run db:push` (this project has no Prisma migration history, so `db:push` is the workflow). `postdb:push` mirrors the schema to Supabase automatically.
3. **Important**: If you hit RLS issues during migrations, ensure the `shadow database` has the appropriate permissions or is temporarily disabled for the migration user.

### Adding New Reports

1. Add the query logic to `lib/analytics/reports.ts`.
2. Update `app/staff/reports/page.tsx` to include the new tab or metric card.
3. **Performance Tip**: Wrap sequential database calls in `Promise.all` to avoid blocking the main thread.

---

## 📍 Handover Contact

For high-level project vision, contact the Project Manager. For architectural questions, refer to the `docs/architecture` folder.
