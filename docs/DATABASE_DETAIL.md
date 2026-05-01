# Database & Security Deep-Dive

This document details the database schema, relational patterns, and Row Level Security (RLS) implementation.

## 🗄️ Database Schema (Prisma)

The schema is built around five core domains:

### 1. User & Profiles
- **User**: The central identity. Roles include `APPLICANT`, `STUDENT`, `INSTRUCTOR`, `STAFF`, `ADMIN`, and `SUPER_ADMIN`.
- **Profiles**: Split into `StudentProfile`, `InstructorProfile`, and `StaffProfile` to keep the main `User` table clean and optimized.
- **Registration**: Handles applicant-to-student transition via `registrationCode` and `registrationFee`.

### 2. Academic Core
- **Course**: Represents modules (e.g., M1, M2) or full programmes.
- **Enrollment**: Links users to courses. Tracks `amountPaid` and `status` (PENDING, ACTIVE, COMPLETED).
- **StudyPathway**: Defines the sequence of courses for specific license targets (e.g., B1.1 vs B2).

### 3. Exam & Evaluation
- **ExamEvent**: High-level event container (e.g., "June 2024 Session").
- **ExamPool**: A slot within an event. Managed using a "fill-rate" logic with configurable `minCandidates` and `maxCandidates` per-pool (defaulting to 25-28) to ensure instructor cost-efficiency.
- **PoolMembership**: The join record between a student and a pool.

### 4. Financial System
- **Wallet**: A virtual balance for each student.
- **WalletTransaction**: Immutable ledger of all movements. Includes `RESERVE` (for pending exam joins) and `RELEASE`/`PAYMENT`.
- **Payment**: Tracks external proof-of-payments (manual bank transfers) which are later reconciled by Staff.

### 5. Academic Management
- **Class**: A specific instance of a course with an instructor and schedule.
- **AttendanceRecord**: Daily tracking for compliance with EASA training requirements.

### 6. Communication & Calendar
- **AdminCalendarEvent**: Broadcasted events with audience targeting (`ALL`, `STUDENTS`, `INSTRUCTORS`, `SPECIFIC_USER`, or pathway-specific).
- **StudentCalendarEvent**: Personalized calendar entries synced from admin broadcasts or personal student schedules.
- **Message**: Internal staff-to-user messaging system.

---

## 🛡️ Row Level Security (RLS) Strategy

The system uses a hybrid security model:

### Next.js Middleware
Routes are protected at the edge via `middleware.ts`, verifying roles before the request even hits the server action.

### Database-Level RLS
For direct database access (e.g., via the Neon Console, Supabase Dashboard, or external BI tools), RLS policies are active.
- **Policies**: 
  - `Students can only view their own Wallet and Enrollments.`
  - `Instructors can view classes they are assigned to.`
  - `Staff have bypass permissions for administrative tables.`
- **Implementation**: Policies use the `auth.uid()` function. In the Next.js app, we inject the user's ID into the session using a custom Prisma extension located in `lib/prisma/rls.ts`. This applies to both the primary Neon database and the redundant Supabase instance.

---

## 🚦 Common Query Patterns

### The "Dashboard Bottleneck"
The Reports dashboard executes ~20 concurrent queries. 
- **Pattern**: Use `Promise.all` in the Server Component.
- **Bottleneck**: Prisma's connection pool can become saturated in dev.
- **Solution**: Indexed columns on `status`, `createdAt`, and `userId` are critical. Ensure any new analytic query includes these in the `where` clause.

### Atomicity in Exams
Joining a pool uses `SELECT FOR UPDATE` (simulated via Prisma transactions) to prevent over-filling pools beyond the `maxCandidates` limit.
