# Changelog

## [1.0.52] — 2026-07-22

### Changed

- Maintenance and stability updates.

## [1.0.51] — 2026-07-22

### Changed

- Maintenance and stability updates.

## [1.0.50] — 2026-07-21

### Changed

- Maintenance and stability updates.

## [1.0.49] — 2026-07-21

### Changed

- Maintenance and stability updates.

## [1.0.48] — 2026-07-21

### Changed

- Maintenance and stability updates.

## [1.0.47] — 2026-07-08

### Changed

- Maintenance and stability updates.

## [1.0.46] — 2026-07-08

### Changed

- Maintenance and stability updates.

## [1.0.45] — 2026-07-08

### Changed

- Maintenance and stability updates.

## [1.0.44] — 2026-07-08

### Changed

- Maintenance and stability updates.

## [1.0.43] — 2026-07-08

### Changed

- Maintenance and stability updates.

## [1.0.42] — 2026-07-08

### Changed

- Maintenance and stability updates.

## [1.0.41] — 2026-07-08

### Changed

- Maintenance and stability updates.

## [1.0.32] — 2026-06-03

### Changed

- Maintenance and stability updates.

## [1.0.31] — 2026-05-30

### Changed

- Maintenance and stability updates.

## [1.0.30] — 2026-05-30

### Changed

- Maintenance and stability updates.

## [1.0.29] — 2026-05-29

### Changed

- Maintenance and stability updates.

## [1.0.28] — 2026-05-29

### Changed

- Maintenance and stability updates.

## [1.0.27] — 2026-05-29

### Changed

- Maintenance and stability updates.

## [1.0.26] — 2026-05-26

### Changed

- Maintenance and stability updates.

## [1.0.25] — 2026-05-26

### Changed

- Maintenance and stability updates.

## [1.0.24] — 2026-05-26

### Changed

- Maintenance and stability updates.

## [1.0.23] — 2026-05-26

### Changed

- Maintenance and stability updates.

## [1.0.22] — 2026-05-26

### Changed

- Maintenance and stability updates.

## [1.0.21] — 2026-05-22

### Changed

- Maintenance and stability updates.

## [1.0.20] — 2026-05-21

### Changed

- Maintenance and stability updates.

## [1.0.19] — 2026-05-21

### Changed

- Maintenance and stability updates.

## [1.0.18] — 2026-05-21

### Changed

- Maintenance and stability updates.

## [1.0.17] — 2026-05-21

### Changed

- Maintenance and stability updates.

## [1.0.16] — 2026-05-21

### Changed

- Maintenance and stability updates.

## [1.0.15] — 2026-05-21

### Changed

- Maintenance and stability updates.

## [1.0.14] — 2026-05-21

### Changed

- Maintenance and stability updates.

## [1.0.13] — 2026-05-21

### Changed

- Maintenance and stability updates.

## [1.0.12] — 2026-05-19

### Changed

- Maintenance and stability updates.

## [1.0.11] — 2026-05-19

### Changed

- Maintenance and stability updates.

## [1.0.10] — 2026-05-18

### Changed

- Maintenance and stability updates.

## [1.0.9] — 2026-05-18

### Changed

- Maintenance and stability updates.

## [1.0.8] — 2026-05-18

### Changed

- Maintenance and stability updates.

## [1.0.7] — 2026-05-18

### Changed

- Maintenance and stability updates.

## [1.0.6] — 2026-05-18

### Changed

- Maintenance and stability updates.

## [1.0.5] — 2026-05-18

### Changed

- Maintenance and stability updates.

## [1.0.4] — 2026-05-18

### Changed

- Maintenance and stability updates.

## [1.0.3] — 2026-05-17

### Changed

- Maintenance and stability updates.

## [1.0.2] — 2026-05-17

### Changed

- Maintenance and stability updates.

## Unreleased

### Added

- **Student Portal Navigation & UX** — Implemented motion-based tabbed interface components, a reusable unsaved changes hook for data protection during navigation, and updated the student sidebar navigation.
- **MessageThread Component** — Added a dedicated `MessageThread` component allowing students and staff to view, reply to, and mark message threads as read.
- **Student Course Enrollment & Exam Booking** — Implemented dedicated server actions for course enrollment flows and exam pool bookings directly from the student portal.
- **Exam Lockdown Mode** — Hardened internal exam workflows with a mandatory Fullscreen API prompt, tab-switching detection, and sidebar/header concealment using CSS (`.exam-lockdown`) for a distraction-free and secure testing environment.
- **Internal Exam Engine & APIs** — Built internal exam bank management, student session initialization APIs, per-question reporting, and an admin regrade capability.
- **Pass/Fail Grading System** — Migrated the academic grading UI from A/B/C/F letter grades to a compliant EASA Pass/Fail system (Pass ≥ 75%).
- **UI Legends** — Implemented persistent descriptive legends in exam and grade tables (`ExamHistoryTable`, `GradesTable`) to clarify status badges (ORIGINAL/HISTORICAL) and EASA grading thresholds.
- **Admissions/Internal Exam documentation refresh** — Documented current Phase 8 implementation status, including student detail confirmation, enrolled-course exam filtering, staff share links, skip/review navigation, autosave, and keyboard auto-submit behavior.
- **Internal exam handover notes** — Added operational pointers for staff bank management, student exam flow, feature flagging, and the main API/component files.
- **GDPR Data Retention Policy Engine** — Implemented a GDPR data retention policy engine and automated sweep service to manage historical user data securely and automatically.
- **Dynamic System Settings** — Added a reusable dynamic system settings management API endpoint and React form component for the staff settings portal, including fixes to properly capture boolean toggles.
- **CI/CD Pipeline & Deployments** — Configured a production CI/CD pipeline using Bun for the test environment, complete with automated scripts to terminate active database connections and clear stale Postgres advisory locks prior to schema migrations on Vercel.

## [1.5.0] — 2026-05-13

### Added

- **Two-Factor Authentication (2FA)** — TOTP-based 2FA for staff/admin accounts. Setup via Settings → Security tab with QR code enrollment, 6-digit verification, and optional disable flow. Login form intercepts `2FA_REQUIRED` error to prompt for TOTP code before completing sign-in
- **Interactive Floor Plan Designer** — CSS grid-based classroom layout builder at `/staff/classrooms/[id]`. Paint-drag tools for DESK, AISLE, and OBSTACLE cells. Auto-generates seat labels (A1, A2, B1…). Saves layout JSON and syncs `Seat` records in a single transaction
- **Exam Seating Assignment** — Drag-and-drop interface at `/staff/exams/sittings/[id]/seating` for assigning students to seats in exam halls. Visual floor plan with unassigned student sidebar
- **Class Seating Assignment** — Staff can assign students to seats within classes at `/staff/classes/[id]/seating`. Assignments stored as JSON in SystemSettings (`class_seating_{classId}` keys)
- **Student Seating View** — Students can view their assigned seats for both classes and exams at `/student/seating` with mini floor plan visualizations highlighting their seat
- **Enhanced Classmates Directory** — Expanded from 2 filters to 6 filter modes: batch, classmates, year, semester, pathway, and class. Sub-filter badges for each dimension. Semester badge added to peer cards
- **Role-Specific Welcome Tours** — Comprehensive `react-joyride` tours covering all portal features: 12 steps for students (wallet, courses, exams, grades, classmates, seating, attendance, notifications), 10 steps for staff/admin (students, classes, facilities, exams, finance, settings with 2FA mention), 5 steps for applicants

### New API Endpoints

- `GET/PUT /api/staff/classrooms/[id]/layout` — Save/retrieve classroom floor plan layout and sync Seat records
- `GET/PUT /api/staff/exams/sittings/[id]/seats` — Batch-update exam sitting seat assignments
- `GET/PUT /api/staff/classes/[id]/seating` — Class seating assignments via SystemSettings
- `GET /api/staff/classes/[id]/seats` — Class with classroom/seats and enrolled students
- `POST /api/auth/2fa/generate` — Generate TOTP secret and QR code for 2FA setup
- `POST /api/auth/2fa/verify` — Verify TOTP code and enable 2FA on account
- `POST /api/auth/2fa/disable` — Verify TOTP code and disable 2FA

### Fixed

- **otplib v5 breaking API** — Migrated from removed `authenticator` export to v5 named exports (`generateSecret`, `generateURI`, `verify`). The `verify()` function now returns `{valid: boolean}` instead of a plain boolean
- **Prisma JSON null filter** — Changed `layout: { not: null }` to `layout: { not: Prisma.DbNull }` for correct JSON field null filtering
- **AppTour TypeScript errors** — Resolved pre-existing type errors in `react-joyride` event callback typing

## [1.4.0] — 2026-05-06

### Added

- **Historical Financial Filtering** — Reports tab now includes year/month selectors allowing staff to view revenue data from any historical period, not just the current rolling 12 months
- **Financial Report Export** — Premium HTML report page at `/api/staff/finance/reports/export` with Print/Save-as-PDF support, styled with Inter font, KPI cards, bar charts, and payment method tables
- **Paginated Transactions Table** — `GET /api/staff/finance/transactions` API with server-side pagination (`page`, `limit`), sorting (`sortBy`, `sortDir`), and search (`query`). Client component replaces the old 100-row hard limit
- **Reports API** — `GET /api/staff/finance/reports` with `year`/`month` query params for dynamic data filtering
- **ExamBooking & ExamResult entity resolution** in audit logs page — shows "Student Name — Module Code" instead of raw CUIDs

### Fixed

- **EXAMINER role 400 error** — Added `EXAMINER` to the Zod `updateRoleSchema` enum; auto-creates `InstructorProfile` with `EX-` prefix employee IDs
- **Raw database IDs** — Financial transaction references now display `ENR-XXXX`, `EXM-XXXX`, `PAY-XXXX` instead of raw CUIDs
- **Raw student IDs in audit logs** — Audit log descriptions now show student full names instead of `cmXXXXXXXXXXXX`
- **Chart rendering warnings** — Added `minWidth={0} minHeight={0}` to all 8 `ResponsiveContainer` instances, eliminating `width(-1) height(-1)` console warnings during tab switches

## [1.3.0] — 2026-05-06

### Security

- **Cron endpoint hardened** — POST handler on `/api/cron/milestone-reminders` now requires `CRON_SECRET` bearer auth (was previously unprotected)
- **Race condition fixed** — Wallet top-up route wrapped in Serializable transaction with duplicate detection to prevent double-spending
- **Zod validation added** — Charter booking, pool merge, wallet proof, and staff book-exam routes now validate input with Zod schemas

### Performance

- **111 loading.tsx files** added across all portals for Suspense streaming
- **82+ staff API routes** switched from RLS `prisma` to `prismaUnfiltered` to eliminate unnecessary transaction overhead
- **Sequential queries parallelized** — License requirements, course detail, exam event detail pages now use `Promise.all`
- **6 reference data queries cached** — Course categories, license categories, academic years, semesters, exam components, active courses (5min TTL via `unstable_cache`)
- **NewsMarkdownEditor** (681-line TipTap component) now lazy-loaded via `next/dynamic` in newsroom create/edit pages
- **7 chart components** lazy-loaded in staff reports
- **N+1 patterns fixed** — bulk-send-credentials, enrollments/batch, cron/send-reminders
- **6 unbounded API routes** capped with `take` limits

### Refactored

- **Promotion logic consolidated** — `promoteIfFirstExamActivity()` and `upgradeRoleInTransaction()` replace 5 inline copies across book-exam, join-pool, bundles, full-time enrollment, and tuition booking
- **Payment splits configurable** — Year 1 (40/30/30) and Year 2+ (50/50) splits moved from hardcoded values to SystemSettings (`getPaymentSplitConfig()`)
- **Charter & merge routes modernized** — Now use `withErrorHandler` + `requireStaff()` instead of manual session checks

### Fixed

- **Vercel DB connection failure** — Restored `@prisma/adapter-pg` after `@prisma/adapter-neon` broke serverless runtime (ws module incompatible with Turbopack bundles)
- **6 public pages** — Added `force-dynamic` to prevent build-time DB query failures
- **Calendar megaquery** — Scoped to user's pools and future events only
- **Removed dead dependencies** — three, shadergradient, styled-components, bufferutil, utf-8-validate, ws, @types/ws, react-hot-toast

## [1.2.0] — 2026-05-01

### Added

- **Exam Pooling Refactor**: Migrated to a canonical `joinPool` service with support for per-pool `minCandidates` and `maxCandidates` thresholds.
- **Student Calendar Audience Controls**: Implemented granular targeting for admin-created calendar events, including `SPECIFIC_USER` and profile-based filtering (Exam Only, Modular, Full Time).
- **Academic Data Seeding**: High-fidelity seeding scripts for Exam Sittings, Examiner assignments, Invoices, and Referral chains.
- **Automated Test Accounts**: Comprehensive set of test accounts covering all student pathway layouts (4Y, 2Y, Military, Modular).

### Changed

- **Database Safety**: Increased Prisma transaction timeouts to 30s to mitigate connection saturation during high-latency periods.
- **Security**: Finalized RLS (Row Level Security) hardening for all sensitive tables (Wallets, Enrollments, Audit Logs).
- **TypeScript Integrity**: Completed a project-wide `tsc` audit, resolving type debt and ensuring strict type safety across all portals.
- **Next.js 15/16 Fixes**: Refactored `searchParams` unwrap logic in Staff Audit Logs and other async components.

### Fixed

- **LSP Stability**: Resolved persistent "Client is not running" errors by optimizing background worker processes and IDE connection handling.
- **Wallet Logic**: Atomic `chargeWallet` function now consistently used for all financial bookings to ensure audit log integrity.

## [1.1.0] — 2026-04-21

### Added

- Comprehensive Developer Handover documentation (`docs/guides/handover.md`, `docs/architecture/database-detail.md`, `docs/architecture/strategies.md`).
- Known issues tracking system (`docs/known-issues.md`).
- Redundant database configuration (Supabase as secondary/backup to Neon primary).

### Changed

- **Performance**: Optimized Staff Analytics Dashboard with parallel data fetching and connection pool management.
- **Branding**: Standardized visual identity using `aerojet-blue` across all portal headers, labels, and UI components.
- **Charts**: Resolved Recharts `width/height` console warnings by implementing `minWidth={1}` and `minHeight={1}` on all `ResponsiveContainer` instances.
- **Documentation**: Updated `README.md` and `future_plans.md` to reflect the current academy-focused scope.

### Removed

- `/careers` public portal and associated recruitment forms.
- Recruitment-specific modules (LAE, HR/ATS) to refocus on Academy core management.

## [1.0.0] — 2026-02-17

### Added

- Complete multi-portal system (Staff, Student, Applicant, Instructor)
- Registration and applicant approval workflow
- Student promotion with auto-generated IDs and wallets
- Exam pool system with 25-member confirmation threshold
- Wallet with reserve/capture/release fund management
- Course and enrollment management
- Class scheduling and attendance tracking
- Grade entry and certificate generation
- Cron jobs for pool checks, event updates, exam reminders
- Audit logging for all critical actions
- Email notifications via Resend
- File upload support via UploadThing
- Public website with course information
