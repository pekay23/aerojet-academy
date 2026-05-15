# Developer Handover Documentation

This document provides a comprehensive guide for developers taking over the Aerojet Academy portal. It covers recent implementations, architectural decisions, and known challenges.

## 🚀 Quick Links
- [Database & RLS Detail](./DATABASE_DETAIL.md)
- [Architecture & Problem Solving](./ARCHITECTURE_STRATEGIES.md)
- [Known Issues & Pending Fixes](./KNOWN_ISSUES.md)
- [Future Roadmap](./future_plans.md)

---

## 🏗️ Technical Stack
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript (Strict Mode)
- **Database**: PostgreSQL (**Neon** as Primary, **Supabase** as Redundant/Backup)
- **ORM**: Prisma
- **Styling**: Tailwind CSS + Shadcn UI
- **Auth**: NextAuth.js + TOTP 2FA (otplib v5)
- **File Storage**: UploadThing

---

## 💎 Recently Implemented Features

### 1. Staff Analytics Dashboard (`/staff/reports`)
- **Tabbed Analytics**: Overview, Enrollment, Revenue, Exam Pools, and Attendance.
- **Timeframe Filtering**: Supports granular periods (1h, 4h, 24h, 7d, 30d, custom).
- **Dynamic Charts**: Powered by Recharts with responsive container sizing.
- **Key Files**:
  - `app/staff/reports/page.tsx`
  - `lib/analytics/reports.ts`
  - `lib/analytics/metrics.ts`

### 2. Two-Factor Authentication (`/staff/settings` → Security tab)
- TOTP-based 2FA for staff/admin accounts using `otplib` v5.
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
- Admissions pipeline models, applicant stages, document uploads, aptitude testing, shortlisting, interviews, medical review, legacy import, and internal exams are scaffolded in `prisma/schema.prisma` and documented in `docs/admissions-pipeline-plan.md`.
- Internal exams are feature-flagged by `internal_exam_system_enabled`.
- Staff manage exam banks at `/staff/exams/internal`; expanded bank rows include pool health, rules, and a copyable student-facing link.
- Students use `/student/exams/internal`; the dashboard only lists exam banks for enrolled courses, requires candidate-detail confirmation before starting, supports skip/review navigation, autosaves answers, and confirms submission.
- Keyboard anti-cheat is enforced in the live exam UI when `allowKeyboardAutoSubmit` is enabled; the submit API records `autoSubmitted` and increments `keyboardEvents`.
- **Key Files**:
  - `app/staff/exams/internal/_components/ExamBankManager.tsx`
  - `app/student/exams/internal/_components/InternalExamDashboard.tsx`
  - `app/student/exams/internal/_components/InternalExamInterface.tsx`
  - `app/api/student/exams/internal/{progress,start,session,answer,submit}/route.ts`
  - `lib/internal-exam/engine.ts`

---

## 🔒 Security & RLS Implementation

### Prisma + Database RLS
The application uses a primary database on Neon with Supabase as a redundant backup.
- **Strategy**: RLS is enforced at the database level. The app currently relies on Prisma's application-level authorization, but a migration to full database-level RLS is in progress.
- **AsyncLocalStorage**: Used in `lib/prisma/rls.ts` (if configured) to inject the `auth.uid()` into the database session, allowing RLS policies to recognize the application user.

---

## 🛠️ Maintenance & Common Tasks

### Versioning & Changelog Automation
The project uses **Husky** and a custom script (`scripts/bump-version.js`) to automate versioning.
- **Automatic Patch**: Every commit automatically bumps the patch version and adds a "Maintenance" entry to `docs/CHANGELOG.md`.
- **Manual Major/Minor Bump**: To perform a major or minor bump, use the `BUMP_TYPE` environment variable:
  ```bash
  $ BUMP_TYPE=minor git commit -m "feat: add new reporting module"
  $ BUMP_TYPE=major git commit -m "break: core database schema change"
  ```
- **Syncing**: The `pre-commit` hook ensures that `package.json` and `docs/CHANGELOG.md` are always in sync with the latest commit.

### Database Migrations
1. Modify `prisma/schema.prisma`.
2. Run `bun x prisma migrate dev --name <description>`.
3. **Important**: If you hit RLS issues during migrations, ensure the `shadow database` has the appropriate permissions or is temporarily disabled for the migration user.

### Adding New Reports
1. Add the query logic to `lib/analytics/reports.ts`.
2. Update `app/staff/reports/page.tsx` to include the new tab or metric card.
3. **Performance Tip**: Wrap sequential database calls in `Promise.all` to avoid blocking the main thread.

---

## 📍 Handover Contact
For high-level project vision, contact the Project Manager. For architectural questions, refer to the `docs/architecture` folder.
