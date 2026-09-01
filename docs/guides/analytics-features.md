# Analytics Features Guide

This document maps every analytics, reporting, and monitoring feature in Aerojet Academy and explains how to access and use each one.

## Table of Contents

1. [Overview](#overview)
2. [Dashboards](#dashboards)
3. [Reports](#reports)
4. [API Reference](#api-reference)
5. [Monitoring & Alerts](#monitoring--alerts)
6. [Event Tracking](#event-tracking)
7. [Data Models](#data-models)
8. [Third-Party Integrations](#third-party-integrations)
9. [Quick Reference: How to View & Monitor](#quick-reference-how-to-view--monitor)

---

## Overview

Aerojet Academy has three distinct analytics surfaces:

| Surface | Route | Purpose |
|---------|-------|---------|
| **Staff Dashboard** | `/staff/dashboard` | Operational snapshot: KPIs, revenue, alerts, Go/No-Go status |
| **Analytics Dashboard** | `/staff/analytics` | Product/behavioral analytics: funnels, retention, feature adoption, page views, user journeys |
| **Reports** | `/staff/reports` | Business intelligence: revenue, enrollment, pools, attendance, exams, year-on-year comparisons |

The analytics **portal pages** (`/staff/dashboard`, `/staff/analytics`, `/staff/reports`) require at least `STAFF` role (enforced in their layouts). `ADMIN` and `SUPER_ADMIN` inherit full access. The raw API endpoints below vary by route — see the `Auth` columns and the auth note above.

---

## Dashboards

### Staff Dashboard (`/staff/dashboard`)

The main operational dashboard. Auto-refreshes every 60 seconds via the `AlertsCenter` banner.

**What you see:**

- **Stat Cards** — active users, pending applicants, active students, pending payments
- **Revenue Chart** — 6-month revenue area chart with target line overlay
- **Go/No-Go Meter** — seat fill percentage and confirmed revenue for the next active exam event
- **Pending Payment Approvals** — cards for each unapproved payment with candidate/amount details
- **Admissions Pipeline Widget** — stage-by-stage applicant funnel

**Files:**

- `app/staff/dashboard/page.tsx` — server component orchestrating all data
- `app/staff/dashboard/_components/AlertsCenter.tsx` — auto-refreshing alert banner
- `app/staff/dashboard/loading.tsx` — Suspense skeleton

**Data source:** Direct `prismaUnfiltered` queries against `User`, `Payment`, `Enrollment`, `ExamPool`, `ExamEvent`.

---

### Analytics Dashboard (`/staff/analytics`)

Product and behavioral analytics with six tabs:

| Tab | Route Param | Component | What It Shows |
|-----|-------------|-----------|---------------|
| **Overview** | `tab=overview` | `MetricsOverview` | Revenue, students, enrollments, pending KPIs + alert counts |
| **Funnels** | `tab=funnels` | `FunnelAnalysis` + `FunnelChart` | Registration → enrollment → exam → payment conversion funnels |
| **Retention** | `tab=retention` | `RetentionAnalysis` + `RetentionHeatmap` | Cohort retention: D1, D7, D30 |
| **Features** | `tab=features` | `FeatureAdoption` + `FeatureChart` | Per-feature adoption rates |
| **Page Views** | `tab=pageviews` | `PageViews` + `PageViewsTable` | Top paths + unique visitors |
| **User Journey** | `tab=journey` | `UserJourney` + `UserJourneyTimeline` | Per-user event timeline |

**Files:**

- `app/staff/analytics/page.tsx` — server component
- `app/staff/analytics/AnalyticsDashboardClient.tsx` — 6-tab client shell
- `app/staff/analytics/_components/*` — individual tab components

**Data source:** `AuditLog` rows with `entity = 'ANALYTICS'` plus `User`, `Payment`, `Enrollment` for metrics. Queries live in `lib/analytics/queries.ts`.

---

### Reports (`/staff/reports`)

Business intelligence reports with seven tabs and CSV export:

| Tab | Route Param | Charts | Data Source |
|-----|-------------|--------|-------------|
| **Overview** | `tab=overview` | Sparkline + summary stats | `getDashboardMetrics()` |
| **Enrollment** | `tab=enrollment` | `EnrollmentChart` | `getEnrollmentTrends()` |
| **Revenue** | `tab=revenue` | `RevenueChart` | `getRevenueReport()` |
| **Pools** | `tab=pools` | `PoolFillChart` | `getPoolAnalytics()` |
| **Attendance** | `tab=attendance` | `AttendanceChart` | `getAttendanceReport()` |
| **Exams** | `tab=exams` | `ExamTrendChart`, `ScoreDistributionChart` | `getExamAnalytics()` |
| **Year-on-Year** | `tab=yoy` | `YoYCharts` | `getYoYComparison()` |

**Features:**

- **Period Filter** — compare MoM, WoW, YoY, 24h, 4h, 1h, or custom ranges
- **CSV Export** — download filtered data as CSV (via `PeriodFilter` dropdown)
- **Lazy-loaded charts** — Recharts components dynamically imported with `ssr: false`

**Files:**

- `app/staff/reports/page.tsx` — 1427-line server component with all 7 tabs
- `app/staff/reports/_components/ReportCharts.tsx` — lazy-loaded Recharts wrappers
- `app/staff/reports/_components/YoYCharts.tsx` — year-on-year comparison charts
- `app/staff/reports/_components/PeriodFilter.tsx` — period selector + CSV export

---

## Reports

### Financial Reports

| Endpoint | File | Returns |
|----------|------|---------|
| `GET /api/staff/reports/revenue` | `app/api/staff/reports/revenue/route.ts` | Total/approved/pending payments, revenue by referenceType, wallet balance stats |

**Lib functions** in `lib/analytics/reports.ts`:

- `getFinanceReportSummary()`
- `getRevenueByProgrammeType()`
- `getPaymentMethodBreakdown()`
- `getMonthlyRevenueData()`
- `getPaymentStatusBreakdown()`
- `getRevenueReport()`

**PDF Export:** `lib/analytics/pdf-export.ts` → `generateFinancialPDF()` generates a branded jsPDF financial report. Currently library-only; no wired API endpoint or UI trigger exists.

---

### Enrollment Reports

| Endpoint | File | Returns |
|----------|------|---------|
| `GET /api/staff/reports/enrollment` | `app/api/staff/reports/enrollment/route.ts` | Totals, by status, by course, by month |

**Lib:** `getEnrollmentTrends()` in `lib/analytics/reports.ts`.

---

### Pool & Exam Reports

| Endpoint | File | Returns |
|----------|------|---------|
| `GET /api/staff/reports/pools` | `app/api/staff/reports/pools/route.ts` | Pool counts, status breakdown, avg members, confirmed revenue |
| `GET /api/staff/reports/roster/[poolId]` | `app/api/staff/reports/roster/[poolId]/route.ts` | **CSV download** of pool roster (candidate name, reg number, module, status). Audit-logged. |

**Lib:** `getPoolAnalytics()`, `getExamAnalytics()`, `getYoYComparison()`, `getCriticalAlerts()` in `lib/analytics/reports.ts`.

---

### Admissions Pipeline

| Endpoint | File | Returns |
|----------|------|---------|
| `GET /api/staff/admissions/pipeline` | `app/api/staff/admissions/pipeline/route.ts` | Stage funnel, programme breakdown, outcomes, 7-day recent activity, active cycles |

Also rendered as a widget on the Staff Dashboard.

---

### CSV Data Exports

| Endpoint | File | Returns |
|----------|------|---------|
| `GET /api/staff/export` | `app/api/staff/export/route.ts` | Date-bounded CSV exports for `students`, `pools`, `finances`, or `audit-logs`. 50,000 row cap (audit-logs clamped to 5,000). |

Triggered from the Period Filter dropdown on `/staff/reports`.

---

### GDPR Data Export (Article 15)

| Lib | File | Purpose |
|-----|------|---------|
| `buildUserDataExport()` | `lib/gdpr/export.ts` | Deep traversal of 25+ related models producing a user's complete data snapshot |

Used by the DSR workflow at `/staff/gdpr`.

---

## API Reference

### Analytics APIs

| Endpoint | Auth | Purpose |
|----------|------|---------|
| `GET /api/staff/analytics/dashboard` | STAFF+ | Alerts + metrics bundle |
| `GET /api/staff/analytics/trends` | STAFF+ | Trend directions + anomaly detection |
| `GET /api/staff/analytics/forecast` | STAFF+ | 6-month revenue forecast |
| `GET /api/staff/analytics/retention` | STAFF+ | Cohort retention data |
| `GET /api/staff/analytics/pipeline` | STAFF+ | Enrollment pipeline prediction |
| `GET /api/staff/analytics/pageviews` | STAFF+ | Page view metrics |
| `GET /api/staff/analytics/funnels` | STAFF+ | Funnel conversion data |
| `GET /api/staff/analytics/features` | STAFF+ | Feature adoption |
| `GET /api/staff/analytics/journey/[id]` | STAFF+ | Per-user event timeline |

> **Auth note:** The active `proxy.ts` is **images-only** and does **not** gate
> `/staff/*` routes, so these API endpoints are protected only by whatever their
> own route handler enforces. `trends`, `forecast`, `pipeline`, and `journey`
> call `requireStaff()`/`getAuthSession()`; `dashboard`, `retention`,
> `pageviews`, `funnels`, and `features` now call `requireStaff()` (added to close
> an unauthenticated-access gap). `export` is guarded via `getServerSession`.
> The analytics **portal pages** (`/staff/dashboard`, `/staff/analytics`,
> `/staff/reports`) remain staff-gated via their layouts.

### Report APIs

| Endpoint | Auth | Purpose |
|----------|------|---------|
| `GET /api/staff/reports/revenue` | STAFF+ | Revenue aggregates |
| `GET /api/staff/reports/enrollment` | STAFF+ | Enrollment breakdown |
| `GET /api/staff/reports/pools` | STAFF+ | Pool analytics |
| `GET /api/staff/reports/roster/[poolId]` | STAFF/ADMIN | CSV roster download |
| `GET /api/staff/export` | STAFF+ | CSV data exports |
| `GET /api/staff/admissions/pipeline` | STAFF+ | Admissions funnel |

---

## Monitoring & Alerts

### Dashboard Alerts (Real-Time)

The `AlertsCenter` component on `/staff/dashboard` polls every 60 seconds. Server-side caching provides a 5-minute TTL via `unstable_cache`.

**7 alert checks** defined in `lib/analytics/dashboard-alerts.ts`:

| # | Alert | Severity | Threshold |
|---|-------|----------|-----------|
| 1 | Payments pending > 7 days | WARNING | CRITICAL if > 10 |
| 2 | GDPR DSRs past 30-day SLA | CRITICAL | — |
| 3 | Referrals with `fraudScore >= 50` unreviewed | WARNING | — |
| 4 | Exam bundles expiring in 7 days with unused resits | INFO | — |
| 5 | UploadThing files unmirrored > 24h | INFO | WARNING if > 100 |
| 6 | Email delivery failures in last 24h | WARNING | CRITICAL if >= 10 |
| 7 | Internal exam reports pending review | INFO | WARNING if >= 5 |

---

### Critical Alerts (Reports)

`getCriticalAlerts()` in `lib/analytics/reports.ts` surfaces:

- Low-fill pools with approaching deadlines
- Stale payments pending > 48 hours

---

### Cron Jobs (Monitoring)

| Cron | Schedule | File | Purpose |
|------|----------|------|---------|
| `check-pools` | Daily 02:00 | `app/api/cron/check-pools/route.ts` | Auto-confirm/fail exam events via Go/No-Go evaluation at payment deadline |
| `check-events` | Daily 01:00 | `app/api/cron/check-events/route.ts` | Auto-complete past exam events |
| `sync-check` | Mon 04:00 | `app/api/cron/sync-check/route.ts` | Neon ↔ Supabase drift detection (> 0.1% → AuditLog) |
| `supabase-mirror` | Daily 04:30 | `app/api/cron/supabase-mirror/route.ts` | Nightly UploadThing → Supabase storage mirror |
| `scheduled-reports` | Mon 08:00 | `app/api/cron/scheduled-reports/route.ts` | **DISABLED** — would email Board Insights Report |
| `gdpr-retention` | Mon 03:00 | `app/api/cron/gdpr-retention/route.ts` | GDPR retention sweep |

> **Note:** The `scheduled-reports` cron returns early with "Feature disabled". The full Board Insights Report pipeline (finance summary + YoY + email via Resend) is built but dormant.

---

### Email Delivery Log

Every outbound email writes an `EmailDelivery` row with `status`, `attempts`, `error`, and `messageId`.

- **View:** Settings → Email Delivery (filterable, searchable, paginated)
- **Model:** `EmailDelivery` in `prisma/schema.prisma` (indexed on `status+createdAt`, `recipient`, `userId`)
- **Monitoring:** Dashboard alert fires when any send fails in the last 24 hours; CRITICAL at >= 10 failures.

---

## Event Tracking

### Event Taxonomy

16 event types defined in `lib/analytics/events.ts`:

- `PAGE_VIEW`
- `REGISTRATION_STARTED`
- `REGISTRATION_COMPLETED`
- `PAYMENT_SUBMITTED`
- `PAYMENT_APPROVED`
- `ENROLLMENT_CREATED`
- `COURSE_ACCESSED`
- `EXAM_POOL_JOINED`
- `EXAM_COMPLETED`
- `FEATURE_USED`
- `SEARCH_PERFORMED`
- `DOCUMENT_UPLOADED`
- `WALLET_TOP_UP`
- `REFERRAL_CLICKED`
- `TOUR_STARTED`
- `TOUR_COMPLETED`

### Where Events Are Emitted

| Event | File | Trigger |
|-------|------|---------|
| `REGISTRATION_COMPLETED` | `app/api/public/register/route.ts:153` | New user registration |
| `PAYMENT_APPROVED` | `app/api/staff/payments/[id]/approve/route.ts:362` | Staff approves a payment |
| `ENROLLMENT_CREATED` | `app/api/applicant/courses/[id]/enroll/route.ts:75` | Applicant enrolls in a course |

### Client-Side Tracking

- **`hooks/useAnalytics.ts`** — `useAnalytics()`, `useSearchTracking()`, `useFeatureTracking()` hooks for automatic page view + feature tracking in client components
- **Note:** The `useAnalytics` hook is not mounted in the root layout, so client-side page view tracking is only active where the hook is explicitly used.

### Storage

All events are written to `AuditLog` with `entity = 'ANALYTICS'`:

- `action` field → event name (e.g. `PAGE_VIEW`, `REGISTRATION_COMPLETED`)
- `changes` field → structured JSON payload
- `userId` → acting user (null for anonymous)
- `ipAddress`, `userAgent` → context

---

## Data Models

### AuditLog (Central Event Store)

| Field | Type | Purpose |
|-------|------|---------|
| `id` | String | Primary key |
| `userId` | String? | Acting user |
| `action` | String | Event name |
| `entity` | String | `'ANALYTICS'` for tracked events |
| `entityId` | String? | Related record ID |
| `description` | String? | Human-readable summary |
| `changes` | Json? | Structured payload |
| `ipAddress` | String? | Client IP |
| `userAgent` | String? | Client user agent |
| `createdAt` | DateTime | Event timestamp |

Companion: `AuditLogArchive` for archived rows.

### EmailDelivery

| Field | Type | Purpose |
|-------|------|---------|
| `recipient` | String | Email address |
| `subject` | String | Email subject |
| `template` | String? | Template name (e.g. `'welcome'`) |
| `status` | String | `pending`, `sent`, `failed` |
| `messageId` | String? | Provider message ID |
| `error` | String? | Error message if failed |
| `attempts` | Int | Send attempt count |
| `userId` | String? | Recipient user ID |
| `createdAt` | DateTime | Created timestamp |

### FileUpload (Sync Monitoring)

| Field | Type | Purpose |
|-------|------|---------|
| `mirroredAt` | DateTime? | When file was mirrored to Supabase |
| `supabasePath` | String? | Supabase storage path |

Used by the dashboard alert to detect UploadThing → Supabase mirror backlog.

### Referral (Fraud Analytics)

| Field | Type | Purpose |
|-------|------|---------|
| `status` | String | Referral status |
| `fraudScore` | Int | 0-100 fraud risk score |
| `fraudReasons` | String[] | Reasons for flagging |
| `reviewedAt` | DateTime? | When reviewed |
| `signupIpHash` | String? | Hashed IP of signup |

### Supporting Models

- `ExamEvent`, `ExamPool`, `PoolMembership`, `ExamBooking`, `ExamResult` — exam analytics
- `WalletTransaction`, `PaymentMilestone` — financial analytics
- `ModularEnrollment` — enrollment analytics
- `SystemSetting` — runtime-configurable thresholds
- `DataSubjectRequest` — GDPR SLA tracking

---

## Third-Party Integrations

| Integration | Type | Mount Point | Purpose |
|-------------|------|-------------|---------|
| `@vercel/analytics` | Product analytics | `app/layout.tsx` (global) | Page views, visitors, referrers |
| `@vercel/speed-insights` | Performance | `app/layout.tsx` (global) | Real Core Web Vitals monitoring |

Both are mounted globally in the root layout for all users. No other third-party analytics (Google Analytics, Mixpanel, Amplitude, Plausible, PostHog, Segment) are integrated.

---

## Quick Reference: How to View & Monitor

### Daily Operations

| Task | Where to Look |
|------|---------------|
| Check operational KPIs | `/staff/dashboard` — stat cards + revenue chart |
| Review alerts | `/staff/dashboard` — `AlertsCenter` banner (auto-refreshes 60s) |
| Approve pending payments | `/staff/dashboard` — pending payment cards |
| Check exam Go/No-Go status | `/staff/dashboard` — Go/No-Go meter |

### Weekly/Monthly Analysis

| Task | Where to Look |
|------|---------------|
| Revenue trends | `/staff/reports?tab=revenue` |
| Enrollment analysis | `/staff/reports?tab=enrollment` |
| Pool fill rates | `/staff/reports?tab=pools` |
| Attendance breakdown | `/staff/reports?tab=attendance` |
| Exam performance | `/staff/reports?tab=exams` |
| Year-on-year comparison | `/staff/reports?tab=yoy` |
| Export CSV data | Period filter dropdown on `/staff/reports` → download CSV |

### Product Analytics

| Task | Where to Look |
|------|---------------|
| Conversion funnels | `/staff/analytics?tab=funnels` |
| User retention | `/staff/analytics?tab=retention` |
| Feature adoption | `/staff/analytics?tab=features` |
| Page views | `/staff/analytics?tab=pageviews` |
| Individual user journey | `/staff/analytics?tab=journey` → select user |
| Overall metrics | `/staff/analytics?tab=overview` |

### Monitoring & Compliance

| Task | Where to Look |
|------|---------------|
| Email delivery health | Settings → Email Delivery |
| GDPR DSR queue | `/staff/gdpr` — 30-day SLA pills |
| Sync health (Neon ↔ Supabase) | AuditLog for drift alerts |
| File mirror backlog | `AlertsCenter` alert #5 |
| Exam reports pending review | `AlertsCenter` alert #7 |
| Fraud referrals | `AlertsCenter` alert #3 + `/staff/reports?tab=overview` critical alerts |

### Raw Data Access

| Need | How |
|------|-----|
| Query analytics events directly | `AuditLog` table where `entity = 'ANALYTICS'` |
| Export all analytics events | `/api/staff/export?type=audit-logs` |
| View email delivery log | Settings → Email Delivery UI, or `EmailDelivery` table |
| Check exam pool rosters | `/api/staff/reports/roster/[poolId]` → CSV |

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `lib/analytics/events.ts` | Event taxonomy + `trackEvent()` |
| `lib/analytics/metrics.ts` | Dashboard metrics (users, revenue, growth) |
| `lib/analytics/queries.ts` | Behavioral queries (funnels, retention, features, pageviews, journeys) |
| `lib/analytics/forecasting.ts` | Revenue forecast + enrollment pipeline prediction |
| `lib/analytics/reports.ts` | Business report queries (enrollment, revenue, pools, attendance, exams, YoY) |
| `lib/analytics/dashboard-alerts.ts` | 7 real-time alert checks |
| `lib/analytics/pdf-export.ts` | jsPDF financial report generator (dormant) |
| `hooks/useAnalytics.ts` | Client-side tracking hooks |
| `prisma/schema.prisma` | AuditLog, EmailDelivery, Referral, and other analytics models |
