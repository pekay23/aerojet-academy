# API Reference

Base URL: `/api` — all routes are Next.js App Router route handlers under
`app/api/**/route.ts`. Server Actions (in `app/**/actions.ts`) handle most
portal mutations and are not exposed as REST routes.

This document was last regenerated against the codebase on **2026-08-28**.
For the canonical list, run `find app/api -name 'route.ts' | sort` and cross-
reference the source. Note: the route list below is a curated summary, not an
exhaustive inventory — many additional sub-routes exist under each prefix.

## Auth (NextAuth + helpers)

- `POST /api/auth/[...nextauth]` — NextAuth core (login, session, etc.)
- `POST /api/auth/2fa/generate` — Generate TOTP secret + QR (staff)
- `POST /api/auth/2fa/verify` — Verify TOTP and enable 2FA
- `POST /api/auth/2fa/disable` — Verify TOTP and disable 2FA
- `POST /api/auth/passkey/*` — WebAuthn passkey register / login
- `POST /api/auth/forgot-password` — Issue password-reset email
- `POST /api/auth/reset-password` — Complete password reset
- `POST /api/auth/verify-email` — Verify email token
- `POST /api/auth/resend-verification` — Resend verification email

## Public (no auth)

- `POST /api/public/register` — Register new applicant
- `POST /api/public/contact` — Submit contact form
- `POST /api/public/submit-payment-proof` — Upload payment proof
- `GET/POST /api/public/courses` — Public course catalog (read)

## Image Proxy (auth-gated)

- `GET /api/images/proxy` — Auth-gated image proxy. Requires valid session. Optional `scope` param enforces role-based access (`students`, `resources`, `staff`, `profile-photos`). Fetches via active storage adapter. Optional `w` (width) and `q` (quality 1–100) params for server-side resize. Returns image with `Cache-Control: private, max-age=3600`.
- `GET /api/images/transform` — Staff-only image transformation. Same auth as proxy plus staff role check. Adds sharp processing: watermark overlay (`© Aerojet Academy`), EXIF stripping, format conversion (`webp`/`jpeg`/`png`/`avif`). Query params: `url` (required), `w`, `watermark`, `strip`, `q`, `format`.

## Admin (SUPER_ADMIN only)

- `/api/admin/*` — Super-admin only routes for org-wide settings
- `/api/admin/backup` — Trigger DB backup
- `/api/admin/bulk-send-credentials` — Bulk email temporary passwords
- `/api/admin/exams` — Cross-tenant exam operations

## Applicant (APPLICANT role)

- `GET /api/applicant/dashboard` — Dashboard
- `GET /api/applicant/courses` — Browse courses
- `POST /api/applicant/courses/[id]/purchase` — Purchase course
- `GET/PATCH /api/applicant/profile` — Profile
- `POST /api/applicant/upload-payment` — Upload payment proof
- `/api/applicant/aptitude` — Aptitude test flow
- `/api/applicant/documents` — Document upload/management
- `/api/applicant/exam-only` — Exam-only applicant flow
- `/api/applicant/interview` — Interview scheduling
- `/api/applicant/medical` — Medical records
- `/api/applicant/pathway-payment` — Pathway payment intent
- `/api/applicant/pay-milestone` — Milestone payment

## Student (STUDENT role)

- `GET /api/student/dashboard` — Full dashboard
- `GET /api/student/wallet` — Wallet balance
- `POST /api/student/wallet/top-up` — Top-up request
- `GET /api/student/wallet/transactions` — History
- `GET/POST /api/student/wallet/*` — Wallet sub-resources
- `GET /api/student/courses` — Enrolled courses
- `GET /api/student/exam-pools/available` — Available pools
- `POST /api/student/exam-pools/[id]/join` — Join pool
- `GET /api/student/grades` — All grades
- `GET /api/student/attendance` — Attendance records
- `GET /api/student/certificates` — Passed exams
- `GET/PATCH /api/student/notifications` — Notifications
- `GET/PATCH /api/student/profile` — Profile
- `POST /api/student/profile/change-password` — Change password
- `/api/student/exams/*` — Exam booking + sitting details
- `/api/student/invoices/*` — Invoice history
- `/api/student/milestones/*` — Milestone progress
- `/api/student/ojt/*` — On-the-job training records
- `/api/student/registration-fee` — Registration fee payment
- `/api/student/topbar-items` — Topbar item order/preferences

## Instructor (INSTRUCTOR role)

- `GET /api/instructor/dashboard`
- `GET /api/instructor/classes` — My classes
- `POST /api/instructor/classes/[id]/attendance`
- `POST /api/instructor/classes/[id]/grades`
- `GET /api/instructor/schedule`
- `/api/instructor/profile`

## Examiner (EXAMINER role)

- `GET /api/examiner/sittings` — View exam sittings
- `GET/POST /api/examiner/results` — Exam results review
- `GET /api/examiner/compliance` — Compliance verification
- `GET/POST /api/examiner/availability` — Availability scheduling

## Staff (STAFF/ADMIN/SUPER_ADMIN)

- `GET/POST /api/staff/users` — List/create
- `GET/PUT/DELETE /api/staff/users/[id]` — User CRUD
- `/api/staff/students`, `/api/staff/instructors`
- `/api/staff/applicants/*` — Applicant approval flow
- `/api/staff/admissions/*` — Admissions pipeline
- `/api/staff/enrollments/*` — Enrollment approval
- `/api/staff/payments/*` — Payment approval
- `/api/staff/wallet-topups/*`
- `/api/staff/courses`, `/api/staff/course-categories`
- `/api/staff/programmes/*`, `/api/staff/programme-upgrades`
- `/api/staff/classes/*`, `/api/staff/classrooms/*`
  - includes `seating` and `layout` endpoints
- `/api/staff/academic/*`, `/api/staff/academic-years`, `/api/staff/semesters`
- `/api/staff/exam-events/*` — Includes `go-no-go` decision
- `/api/staff/exam-pools/*`, `/api/staff/exam-sittings/*`
- `/api/staff/exams/*` — Exam CRUD + internal exam module
- `/api/staff/exam-attendance/*`
- `/api/staff/practical-training/*`, `/api/staff/ojt/*`
- `/api/staff/resit-backfill/*`
- `/api/staff/license-categories/*`, `/api/staff/license-requirements/*`
- `/api/staff/attendance/*`
- `/api/staff/finance/*`, `/api/staff/finance/rates`
- `/api/staff/reports/*` — Enrollment, revenue, pools
- `/api/staff/audit-logs` — Audit log viewer
- `/api/staff/settings/*` — System settings
- `/api/staff/newsroom/*` — News/updates
- `/api/staff/email-templates`, `/api/staff/email-test`, `/api/staff/email-preview`
- `/api/staff/gdpr/*` — GDPR / data subject access
- `/api/staff/referrals/*`
- `/api/staff/payment-methods/*`
- `/api/staff/welcome-messages/*`
- `/api/staff/topbar-items/*`
- `/api/staff/export/*` — CSV / Excel export
- `GET /api/staff/analytics/*` — Analytics rollups

## Cron (requires `CRON_SECRET` in `Authorization: Bearer …`)

- `GET /api/cron/check-pools` — Fail expired pools
- `GET /api/cron/check-events` — Update event statuses
- `GET /api/cron/send-reminders` — Exam reminders (T-7, T-1)
- `GET /api/cron/aptitude-reminders` — Aptitude test reminders
- `GET /api/cron/interview-reminders` — Interview reminders
- `GET /api/cron/milestone-reminders` — Milestone reminders
- `GET /api/cron/modular-deadlines` — Modular deadline checks
- `GET /api/cron/payment-deadlines` — Payment deadline checks
- `GET /api/cron/expire-bundles` — Expire exam bundles
- `GET /api/cron/cleanup-abandoned-accounts` — GDPR cleanup
- `GET /api/cron/cleanup-audit-logs` — Retention policy
- `GET /api/cron/gdpr-retention` — Data retention sweep
- `GET /api/cron/backup` — Daily DB backup
- `GET /api/cron/scheduled-reports` — Scheduled analytics
- `GET /api/cron/sync-check` — Neon ↔ Supabase replication health
- `GET /api/cron/supabase-mirror` — Push pending writes to Supabase

## Me (self-service, any authed user)

- `POST /api/me/heartbeat` — Update presence (called every 30s)
- `PATCH /api/me/privacy` — Toggle privacy settings
- `GET /api/me/study-pathway` — My study pathway

## Search, messaging, calendar

- `GET /api/search` — Global search (cmdk)
- `/api/messages/*` — Internal messages
- `POST /api/messages/presence` — Presence updates
- `GET /api/calendar/[userId]` — User calendar

## Files / uploads

- `/api/uploadthing/core` + `route.ts` — UploadThing file uploads
- `POST /api/pdf/staff/*` — Staff PDF generation
- `POST /api/pdf/student-transcript` — Student transcript PDF
- `POST /api/pdf/test-template` — Test PDF template

## Webhooks

- `POST /api/webhooks/resend` — Resend email events
- `POST /api/webhooks/stripe` — Stripe payment events
- `POST /api/webhooks/uploadthing` — UploadThing events

## Misc

- `GET /api/exchange-rates` — Public FX rates
- `GET /api/payment-methods` + `/api/payment-methods/active`
- `GET /api/banner` — Topbar config
- `POST /api/test-email` — Dev-only test email send
- `GET /api/unsubscribe` — Email unsubscribe (token-based)

## Server Actions (internal API)

Primary data-mutation path for portal interfaces. Located in colocated
`actions.ts` files within each portal (e.g., `app/staff/actions.ts`,
`app/applicant/actions.ts`) and domain-specific `actions.ts` files.

### Staff actions

- `sendStaffMessage(recipientId, subject, body)` — Send internal message
- `bulkUpdateUserStatus(userIds, status)` — Batch update user states
- `updateExamBooking(recordId, data)` — Exam/result sync logic
- `joinPool(poolId)` — Canonical service for adding students to exam pools
- `chargeWallet(userId, amount, type, ...)` — Atomic financial transaction

## Conventions

- All mutation routes go through `withErrorHandler` (`lib/api/response.ts`)
  which converts thrown errors: `'Unauthorized'`→401, `'Forbidden'`→403,
  `'not found'`→404, `'Permission denied'`→403, else→500.
- Pagination: `parsePagination(searchParams)` returns `{ page, limit, skip }`
  with `limit` capped at 100 (`lib/api/response.ts`).
- Every route that mutates state emits an `AuditLog` row.
- Every successful response uses `apiSuccess(data)` → `{ success: true, data }`.
- Every error response uses `apiError(error, status, data?)` → `{ success: false, error, ...data }`
  where `data` is spread into the response (used for validation errors, etc.). The `withErrorHandler`
  wrapper strips stack traces in production — error messages become generic `'Internal server error'`
  outside development.
