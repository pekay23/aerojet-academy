# Applicant Portal — Route Map

Last updated: 2026-08-28

## Overview

The Applicant portal (`app/applicant/`) is the primary entry point for prospective students. It covers registration, course browsing, document uploads, medical forms, aptitude testing, interview booking, and exam-only pathways.

Auth is enforced by the root `layout.tsx`, which redirects unauthenticated users to `/login` and ensures the user role is `APPLICANT`.

## Route Map

### Core Application Flow

| Route | Type | Description |
|-------|------|-------------|
| `/applicant` | Server | Dashboard — status overview, journey timeline, quick links |
| `/applicant/profile` | Server | Profile editor + passkey settings |
| `/applicant/notifications` | Server | Paginated notification list |

### Admissions Pipeline

| Route | Type | Description |
|-------|------|-------------|
| `/applicant/application/status` | Server | Application status tracker (pipeline-aware or legacy 4-step) |
| `/applicant/application/payment` | Server | Upload registration payment proof |
| `/applicant/application/documents` | Client | Upload required admission documents |
| `/applicant/application/aptitude-test` | Client | Aptitude test landing + start flow |
| `/applicant/application/aptitude-test/take` | Client | Live aptitude test interface with timer |
| `/applicant/application/interview` | Server | Interview slot booking |
| `/applicant/application/medical` | Client | Medical examination document upload |

### Course & Exam Pathways

| Route | Type | Description |
|-------|------|-------------|
| `/applicant/courses` | Server | Course catalogue with category filter |
| `/applicant/courses/[id]` | Server | Course detail page |
| `/applicant/courses/[id]/purchase` | Server | Purchase/enroll in a course |
| `/applicant/pathway` | Server | Complete enrollment (full-time / military payment plan) |
| `/applicant/wallet-top-up` | Server | Wallet top-up for exam bookings |
| `/applicant/exam-bookings` | Server | Browse available exam pools |
| `/applicant/exam-bookings/[id]` | Server | Pool detail view |
| `/applicant/exam-only` | Client | Exam-only pathway dashboard (packages, pools, modals) |
| `/applicant/exam-only/dashboard` | Server | Exam-only wallet + recent bookings summary |
| `/applicant/exam-only/top-up` | Server | Exam wallet top-up form |

### Error & Loading Boundaries

| File | Purpose |
|------|---------|
| `app/applicant/error.tsx` | Root error boundary |
| `app/applicant/loading.tsx` | Root loading skeleton |
| `app/applicant/not-found.tsx` | Root 404 page |
| `app/applicant/exam-only/error.tsx` | Exam-only error boundary |
| `app/applicant/exam-only/loading.tsx` | Exam-only loading skeleton |
| `app/applicant/exam-only/dashboard/loading.tsx` | Exam-only dashboard skeleton |

## API Routes

All applicant API routes are under `app/api/applicant/`:

- `GET /api/applicant/dashboard` — Dashboard data
- `GET /api/applicant/profile` — Get profile
- `PATCH /api/applicant/profile` — Update profile
- `POST /api/applicant/profile/change-password` — Change password
- `/api/applicant/courses` — GET course catalog
- `POST /api/applicant/courses/[id]/purchase` — Purchase course
- `POST /api/applicant/courses/[id]/enroll` — Enroll in course
- `GET /api/applicant/courses/[id]` — Course detail
- `GET /api/applicant/documents` — Uploaded documents
- `POST /api/applicant/upload-payment` — Upload payment proof
- `POST /api/applicant/pay-milestone` — Milestone payment
- `POST /api/applicant/pathway-payment` — Pathway payment intent
- `/api/applicant/medical` — GET medical data / POST submit medical docs
- `/api/applicant/interview/slots` — GET available interview slots
- `POST /api/applicant/interview/book` — Book interview slot
- `/api/applicant/aptitude/*` — Session, start, answer, submit, anti-cheat
- `/api/applicant/exam-only/*` — Wallet, top-up, pools, join-pool, join-waitlist, withdraw-pool, bundles, bookings, book-exam, payments, memberships, pricing, exam-components, referrals, wallet/transactions

## Shared Components

| Component | Path | Purpose |
|-----------|------|---------|
| `ApplicantSidebar` | `app/applicant/_components/ApplicantSidebar.tsx` | Dynamic sidebar based on pipeline stage |
| `ForcePasswordChange` | `app/applicant/_components/ForcePasswordChange.tsx` | Password change gate |
| `CourseCard` | `app/applicant/_components/CourseCard.tsx` | Reusable course card |
| `ApplicationStatusCard` | `app/applicant/_components/ApplicationStatusCard.tsx` | Status display card |

## Key Utilities

| Utility | Path | Purpose |
|---------|------|---------|
| `useFetch` | `lib/hooks/useFetch.ts` | Generic data-fetching hook for client components |
| `PageTransition` | `components/shared/PageTransition.tsx` | Consistent page entrance animation |
| `formatDate` / `formatDateTime` | `lib/utils/date.ts` | Centralized date formatting (date-fns) |
| `slugify` | `lib/utils/string.ts` | URL-safe string slugification |
| `examOnlyTypes` | `app/applicant/exam-only/_components/examOnlyTypes.ts` | Shared types + status maps for exam-only |

## Architecture Notes

- **Layout**: `app/applicant/layout.tsx` centralizes auth checks, user lookup, and sidebar configuration. The chrome (sidebar + header + breadcrumb + content shell) is extracted into `components/applicant/ApplicantPortalShell.tsx` (`ApplicantPortalShell`) so the auth-gated shell is defined once and reused by every applicant route.
- **Dual Prisma**: All server components and API routes use `prismaUnfiltered` for performance (RLS bypass since auth is already enforced at layout level).
- **Dark Mode**: All components include `dark:` Tailwind classes.
- **Suspense**: `loading.tsx` files exist for every route segment with server-side data fetching.
