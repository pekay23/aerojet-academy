# Changelog

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
- Comprehensive Developer Handover documentation (`docs/HANDOVER.md`, `docs/DATABASE_DETAIL.md`, `docs/ARCHITECTURE_STRATEGIES.md`).
- Known issues tracking system (`docs/KNOWN_ISSUES.md`).
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
