# Changelog

## [1.0.59] — 2026-07-23

### Changed

- Maintenance and stability updates.

## [1.0.58] — 2026-07-23

### Changed

- Maintenance and stability updates.

## [1.0.57] — 2026-07-23

### Changed

- Maintenance and stability updates.

## [Unreleased]

### Added

- **Auth-gated image proxy & transformation** — Two new API routes (`/api/images/proxy`, `/api/images/transform`) for serving protected images through authenticated endpoints. The proxy validates the user's session and optionally checks role-based scope permissions; the transform endpoint adds sharp-based processing (watermark, resize, format conversion, EXIF stripping) available only to staff roles.
- **Storage adapter abstraction** — `lib/storage/proxy.ts` defines the `StorageAdapter` interface (`fetch(url)` → `{ data, contentType }`) with an HTTP adapter and a commented-out S3 adapter placeholder. Active adapter selected via `STORAGE_ADAPTER` env var.
- **ProtectedImage component** — `components/ProtectedImage.tsx` wraps `next/image` with right-click protection, drag prevention, and an optional invisible overlay to block DevTools element inspection. Supports `priority` prop for above-the-fold preloading.
- **Image proxy URL helpers** — `lib/storage/signed-url.ts` exports `proxyImageUrl()` and `transformImageUrl()` for building proxied image URLs with scope, width, quality, watermark, and format parameters.
- **Newsroom feature** — Full newsroom at `/newsroom` with paginated article listing (`?page=N&limit=N&sort=newest|oldest`), dynamic article detail pages at `/newsroom/[slug]` with SEO metadata (Open Graph, Twitter Cards, JSON-LD), cover image hero with overlay, view counting, read-time calculation, author attribution, and sharing buttons.
- **Newsroom staff management** — Create/edit/publish articles from `/staff/newsroom/create` and `/staff/newsroom/[id]/edit` with markdown editor, cover image upload, tags, custom publish dates, and author attribution.
- **Newsroom seed script** — `prisma/seed-news-article.ts` seeds sample articles (EASA phase completion, Aerojet Foundation, Lufthansa partnership, CEO interview, AME applications, technology in training, USTDA funding) with cover images.
- **Dynamic system settings management** — Staff settings form (`app/staff/settings/_components/SettingsForm.tsx`) for editing runtime configuration with proper boolean toggle capture.
- **Build-time database resilience** — `lib/settings.ts` now detects build phase (`NEXT_PHASE === 'phase-production-build'`) and returns defaults without hitting the database, preventing static-generation failures when the database is unreachable.
- **Image loading optimizations** — Added `priority` prop to hero images, footer logos, partner logos, and loading-screen logo across the codebase to ensure critical images preload instead of lazy-loading. `loading="eager"` upgraded to `priority` where applicable.
- **Exam schedule page** — Public exam schedule page at `/courses/aircraft-engineering/exam-schedule` with EASA exam dates and pricing for 2026.

### Changed

- **Proxy/middleware** — Edge proxy (`proxy.ts`) renamed from `middleware.ts` per Next.js 16 conventions. Build output shows it as `ƒ Proxy (Middleware)`. Role-based route protection continues with `ROUTE_ROLE_MAP`.
- **Package manager metadata** — `package.json` updated with new `type:module` experiment and dependency bumps. Reverted from `type:module` to fix Vercel ESM require error.
- **Tailwind CSS configuration** — Updated to resolve Node.js parsing overhead.
- **Global styles** — `app/globals.css` updated with new utility classes and theme refinements.

### Fixed

- **Stale build cache** — Cleared `.next` directory to fix module resolution errors for `@/lib/storage/proxy`.
- **Database connection failure during build** — `getSystemSettings()`, `getSystemSetting()`, and `getFinanceConfig()` in `lib/settings.ts` now gracefully handle build-time database unavailability by returning defaults.
- **Vercel ESM require error** — Reverted `type:module` from `package.json` after it caused `require()` failures in Vercel's serverless runtime.
- **Logo not loading in loading screen** — Added `priority` to the `<Logo>` component in `app/loading.tsx` so it preloads immediately instead of lazy-loading.

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
