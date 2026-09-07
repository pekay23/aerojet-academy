# Database & Security Deep-Dive

This document details the database schema, relational patterns, and Row Level Security (RLS) implementation.

## 🗄️ Database Schema (Prisma)

The schema is built around five core domains:

### 1. User & Profiles
- **User**: The central identity. Roles include `APPLICANT`, `STUDENT`, `INSTRUCTOR`, `EXAMINER`, `STAFF`, `ADMIN`, and `SUPER_ADMIN`.
- **Profiles**: Split into `StudentProfile`, `InstructorProfile`, and `StaffProfile` to keep the main `User` table clean and optimized.
- **Registration**: Handles applicant-to-student transition via `registrationCode` and `registrationFee`.
- **CourseCategory**: Categorization of courses (e.g., theory, practical, exam), used to group programmes and filter catalog views.

### 2. Academic Core
- **Course**: Represents modules (e.g., M1, M2) or full programmes.
- **Enrollment**: Links users to courses. Tracks `amountPaid` and `status` (PENDING, ACTIVE, COMPLETED).
- **StudyPathwayModel**: Defines the sequence of courses for specific license targets (e.g., B1.1 vs B2).

### 3. Exam & Evaluation
- **ExamEvent**: High-level event container (e.g., "June 2024 Session").
- **ExamComponent**: Sub-components of an exam (e.g., written, oral, practical), each with pass-mark and grading rules.
- **ExamPool**: A slot within an event. Managed using a "fill-rate" logic with configurable `minCandidates` and `maxCandidates` per-pool (defaulting to 25-28) to ensure instructor cost-efficiency.
- **PoolMembership**: The join record between a student and a pool.
- **InternalExamBank / InternalExamQuestion**: Course-linked internal assessment banks. Banks carry rule-set metadata and question-pool sizing so staff can monitor whether enough active questions exist before students sit an exam.
- **InternalExamQuestionVersion**: Versioned history of internal exam questions, tracking the `changedBy` relation to `User` (the staff member who last modified the question). Superseded on each edit, preserving audit trail.
- **InternalExamSession / InternalExamAnswer**: Per-student internal exam attempts and selected answers. Sessions track `expiresAt`, `autoSubmitted`, `keyboardEvents`, score, pass/fail, retake eligibility, and ban state. Answers are autosaved during the exam and graded on submit.

### 4. Financial System
- **Wallet**: A virtual balance for each student. Total Balance = Available + Reserved.
- **WalletTransaction**: Immutable ledger of all movements. Includes `RESERVE` (for pending exam joins) and `DEBIT`/`PAYMENT`.
  - **Integrity Rule**: No booking or pool membership can exist without corresponding funds being either `RESERVED` (for flexible pools) or `DEBITED` (for fixed bookings).
- **Payment**: Tracks external proof-of-payments (manual bank transfers) which are later reconciled by Staff.
- **PaymentMilestone**: Milestone-based payment schedule entries (e.g., registration fee, module fees), linked to `Payment` and `Invoice`.
- **Invoice**: Generated invoices for student financial obligations, linked to `PaymentMilestone` and `WalletTransaction`.
- **PaymentMilestone**: Milestone-based payment schedule entries (e.g., registration fee, module fees), linked to `Payment` and `Invoice`.
- **Invoice**: Generated invoices for student financial obligations, linked to `PaymentMilestone` and `WalletTransaction`.

### 5. Academic Management
- **Class**: A specific instance of a course with an instructor and schedule.
- **ClassSession**: Recurring session instances derived from a `Class`'s recurrence rules (type, days, until), with individual overrides and attendance tracking.
- **AttendanceRecord**: Daily tracking for compliance with EASA training requirements.

### 5a. Facilities & Seating
- **Classroom**: Physical rooms with `layout` (Json) storing a grid definition: `{ rows, cols, cells: [{ row, col, type, label }] }`. Cell types: `DESK`, `AISLE`, `OBSTACLE`.
- **Seat**: Auto-created from layout desk cells. `@@unique([classroomId, row, col])`. Labels auto-generated (A1, A2, B1…).
- **Class Seating**: Stored in `SystemSetting` as `class_seating_{classId}` → JSON map of `{ seatId: userId }`.
- **Exam Seating**: Stored directly on `ExamSittingAssignment.seatId` (FK to `Seat`).
- **Student View**: `/student/seating` aggregates both sources to show mini floor plans with the student's seat highlighted.

### 6. Communication & Calendar
- **AdminCalendarEvent**: Broadcasted events with audience targeting (`ALL`, `STUDENTS`, `INSTRUCTORS`, `SPECIFIC_USER`, or pathway-specific).
- **StudentCalendarEvent**: Personalized calendar entries synced from admin broadcasts or personal student schedules.
- **Message**: Internal staff-to-user messaging system.

### 7. System & Infrastructure
- **Notification**: In-app notifications.
- **AuditLog**: All system actions.
- **AuditLogArchive**: Time-partitioned archive of `AuditLog` rows beyond the retention sweep window (kept for compliance; not queried by the live app).
- **FileUpload**: Uploaded files tracking.
- **SystemSetting**: Key-value admin-editable settings (registration fees, exam pricing, payment splits, email config, class seating assignments as `class_seating_{classId}` keys).
- **PaymentMethod**: Bank transfer details (account name, number, SWIFT, branch).
- **EmailDelivery**: Every `sendEmail()` call logged with `recipient`, `subject`, `template`, `status`, `attempts`, `error`, `messageId`.

### 7. System & Infrastructure
- **Notification**: In-app notifications.
- **AuditLog**: All system actions.
- **AuditLogArchive**: Time-partitioned archive of `AuditLog` rows beyond the retention sweep window (kept for compliance; not queried by the live app).
- **FileUpload**: Uploaded files tracking.
- **SystemSetting**: Key-value admin-editable settings (registration fees, exam pricing, payment splits, email config, class seating assignments as `class_seating_{classId}` keys).
- **PaymentMethod**: Bank transfer details (account name, number, SWIFT, branch).
- **EmailDelivery**: Every `sendEmail()` call logged with `recipient`, `subject`, `template`, `status`, `attempts`, `error`, `messageId`.

---

## 🛡️ Row Level Security (RLS) Strategy

The system uses a hybrid security model:

### Route Protection (Layered)

Route protection is enforced in three layers:

1. **Edge proxy** (`proxy.ts`) — images-only; gates `/api/images/*` (auth +
   hotlink/header protection). Does **not** gate portal routes.
2. **Portal layouts** — each portal's `layout.tsx` calls `requireStaff`/
   `requireInstructor`/`requireStudent`/etc. from `lib/auth/helpers.ts` as
   the primary gate.
3. **Route handlers / server actions** — call `requireAdmin()`/`requireAuth()`
   /`requireStaff()`/`requirePermission()` directly.

`middleware.ts` was renamed to `proxy.ts` per Next.js 16 naming conventions,
but its scope is limited to image proxy — not portal route protection.

### Database-Level RLS

For direct database access (e.g., via the Neon Console, Supabase Dashboard, or
external BI tools), RLS policies are defined. The codebase also uses a dual
Prisma client pattern: `prismaUnfiltered` (raw client, no RLS overhead) for
portal code that is already auth-gated at the layout/handler layers, and the
`prisma` default export (extended with soft-delete + RLS session variables)
for defense-in-depth. Neon connections use the pooler (`*.pooler.region...`)
in production; `@prisma/adapter-pg` with the standard `pg` driver is used on
Vercel.

---

## 🚦 Common Query Patterns

### The "Dashboard Bottleneck"
The Reports dashboard executes ~20 concurrent queries. 
- **Pattern**: Use `Promise.all` in the Server Component.
- **Bottleneck**: Prisma's connection pool can become saturated in dev.
- **Solution**: Indexed columns on `status`, `createdAt`, and `userId` are critical. Ensure any new analytic query includes these in the `where` clause.

### Atomicity in Exams
Joining a pool uses `SELECT FOR UPDATE` (simulated via Prisma transactions) to prevent over-filling pools beyond the `maxCandidates` limit.
