# Future Plans

This document tracks planned features and improvements for the Aerojet Academy platform.
Items are grouped by original category then ordered by implementation effort in the **Priority Queue** at the bottom.

**Last audited:** 2026-05-06 (bulk update)

---

## 🎓 1. Academy Class Management Redesign

### Student & Batch Enrollment

- [x] **Batch Selection**: Bulk-selection interface to enroll entire batches (Academic Year + Semester cohorts) into a class in one action.
- [x] **Roster Management**: Comprehensive student list view within each class with status tracking (Enrolled, Dropped, Completed).
- [x] ~~**Auto-Enrollment Logic**: Link classes to specific student qualifications or pathway requirements~~ _(engine exists in `lib/enrollment/engine.ts` — auto-enrolls via `AcademicTerm` → `TermCourseAssignment` mapping)_

### Pathway & Academic Context

- [x] ~~**Pathway Constraints**: Restrict class visibility or enrollment based on the student's assigned `StudyPathway`~~ _(done 2026-05-06 — enrollment page filters by license targets via `applicableCategories`)_
- [x] ~~**Pre-requisite Validation**: Automatic checking if students meet the course requirements before allowing class assignment~~ _(done 2026-05-06 — `validatePrerequisites()` in `lib/enrollment/validation.ts`, uses `requiresPrerequisite` + `prerequisites[]` on Course)_

### Physical Resource Management

- [x] **Classroom Mapping**: Assign classes to specific physical rooms or labs in the academy.
- [x] **Capacity Enforcement**: Real-time validation of `maxStudents` against physical room seating capacity.
- [x] ~~**Seating Arrangements**: Interactive floor plan / seating chart designer with drag-and-drop student assignment and visual occupancy heatmaps~~ _(done 2026-05-13 — FloorPlanDesigner with CSS grid paint-drag tools, exam + class seating assignment, student-facing seating view)_

### Enhanced Scheduling

- [x] **Weekly Schedule UI**: Replace JSON configuration with a visual calendar/grid picker for daily instruction hours.
- [x] ~~**Conflict Detection**: Time-based examiner overlap (respects `maxParallelSittings`) and venue overlap detection~~ _(done 2026-05-06)_
- [x] ~~**Holiday/Break Exclusion**: Automatically exclude academy holidays from the session count~~ _(done 2026-05-06 — `isHoliday` field on `AdminCalendarEvent`, `lib/calendar/holidays.ts` helper, integrated into exam scheduler)_

---

## 👥 2. Student Peer Visibility

### Classmate Directory

- [x] ~~**Class Roster View**: Students assigned to a class can view a directory of classmates with profile photos/avatars and full names~~ _(done 2026-05-06)_
- [x] ~~**Sort & Filter**: Sortable by name, with search functionality~~ _(done 2026-05-06)_
- [x] ~~**Profile Cards**: Compact card layout with student avatar, name, and study pathway badge~~ _(done 2026-05-06)_

### Year Group / Batch Directory

- [x] ~~**Batch-level View**: Toggle between viewing just their class and the full intake batch~~ _(done 2026-05-06)_
- [x] ~~**Class Filtering**: Tabs/filters to switch between own class and full batch~~ _(done 2026-05-06)_
- [x] ~~**Privacy Controls**: Only enrolled students within the same academic year or intake group can see each other. Enforced at API level via RLS or scoped queries~~ _(done 2026-05-06)_

---

## 📊 3. Advanced Analytics & Reporting

### Predictive Analytics

- [x] ~~Revenue forecasting based on historical exam enrollment trends~~ _(done 2026-05-06 — `getRevenueForecast()` in `lib/analytics/forecasting.ts`, linear regression + EMA hybrid with confidence intervals)_
- [x] ~~Enrollment pipeline predictions (applicant to student conversion rates)~~ _(done 2026-05-06 — `getEnrollmentPipeline()` in `lib/analytics/forecasting.ts`, monthly conversion rate tracking + prediction)_

### Automated Reporting

- [x] ~~Scheduled PDF reports for board members (Revenue, Enrollment, Attendance)~~ _(done 2026-05-06, **hidden** — see Hidden Features section)_
- [x] ~~Email-based report delivery on configurable schedules (weekly/monthly)~~ _(done 2026-05-06, **hidden** — see Hidden Features section)_

### Performance Benchmarking

- [x] ~~Year-over-year comparison dashboards~~ _(done 2026-05-06)_
- [x] ~~Automatic trend detection with anomaly highlighting~~ _(done 2026-05-06 — `detectTrends()` in `lib/analytics/forecasting.ts`, z-score anomaly detection across revenue/enrollment/pass-rate)_

---

## 🏗️ 4. Structural Improvements (P2 Backlog)

### Code Quality

- [x] ~~Break up long functions — `getDashboardData` refactored into helper functions~~ _(done 2026-05-06)_
- [x] ~~Break up `UsersTable` (479→230 lines) — extracted `UsersTableRow`, `UsersTableFilters`, shared types~~ _(done 2026-05-06)_
- [x] ~~Add `error.tsx` in `(auth)` segment~~ _(done 2026-05-06)_
- [x] ~~Add `not-found.tsx` in `(auth)` and `(portal)` segments~~ _(done 2026-05-06)_
- [x] ~~Remove dead config — 3 unused font families in `tailwind.config.ts`~~ _(done 2026-05-06)_

### Polish

- [x] ~~Centralize hardcoded values — status arrays now in `lib/utils/constants.ts` with Prisma-typed constants~~ _(done 2026-05-06)_
- [x] ~~Replace `<img>` with `next/image` — 2 instances in newsroom create page~~ _(done 2026-05-06)_
- [x] ~~Rate limiting — `submit-payment-proof` rate-limited to 5/hr per IP~~ _(done 2026-05-06)_

---

## 💰 5. Financial System Enhancements

### Revenue by Programme Type — Year/Month Scoping

- [x] ~~`getRevenueByProgrammeType()` and `getPaymentStatusBreakdown()` now accept `year`/`month` params~~ _(done 2026-05-06)_

### Invoice Generation

- [ ] Auto-generate PDF invoices for enrollment payments.
- [ ] Invoice numbering system tied to academic year. _(Invoice model exists in schema — needs generation logic)_

### Payment Gateway Integration

- [ ] Direct online payment via Stripe/Paystack instead of manual proof uploads. _(Stripe webhook handler exists, checkout flow not built)_
- [ ] Automatic reconciliation on payment webhook confirmation.

---

## 🔐 6. Security & Compliance

### Audit Trail Enhancements

- [x] ~~Immutable audit log CSV export for regulatory compliance~~ _(done 2026-05-06)_
- [x] ~~Audit log retention policies and archival~~ _(done 2026-05-06 — configurable via `audit_log_retention_days` setting, `AuditLogArchive` model, archival before deletion in cron)_

### Access Control

- [x] ~~Adopt granular permissions (`requirePermission()`) in critical staff endpoints — audit logs, go/no-go, role changes, enrollment approval, payment approval/rejection~~ _(done 2026-05-06)_
- [x] ~~Two-factor authentication for staff accounts~~ _(done 2026-05-13 — TOTP-based 2FA via otplib v5, Settings → Security tab, login flow 2FA interception)_

---

## 📄 7. PDF Template System & Document Verification

> **Detailed plan:** [`docs/plans/pdf-template-system.md`](./pdf-template-system.md)

### Template Configuration

- [ ] Data-driven PDF templates — staff can edit text content, labels, and descriptions via UI
- [ ] Template lifecycle management (Draft → Active → Archived) with cloning
- [ ] Per-template branding overrides (logo, watermark, footer)
- [ ] Configurable certificate numbering format (`CERT-{YYYY}-{SEQ:4}`)

### Signature Management

- [ ] Upload and manage digital signature images (PNG/JPG, Supabase Storage)
- [ ] Assign signatures to template positions (left/right slots)
- [ ] Signature expiry tracking for role changes
- [ ] Signer name and role label management

### Document Verification (QR Codes)

- [ ] Unique verification code per generated document
- [ ] QR code embedded in PDF footer/accreditation area
- [ ] Public `/verify/[code]` page — no auth required, shows document authenticity
- [ ] Verification record with recipient, document type, issue date, certificate number

### Enhanced Preview

- [ ] Real student data picker in Live PDF Viewer
- [ ] Template selector dropdown in preview
- [ ] Live signature rendering in preview

---

## 📋 Priority Implementation Queue

All remaining items ordered from **quickest/easiest** to **longest/hardest**.
Use this queue to pick the next item to implement.

### Tier 1 — Quick Wins (under 1 hour each)

| #   | Item                                                                                         | Est.    | Section | Status   |
| --- | -------------------------------------------------------------------------------------------- | ------- | ------- | -------- |
| 1   | Add `error.tsx` in `(auth)` segment                                                          | ~10 min | 4       | **Done** |
| 2   | Add `not-found.tsx` in `(auth)` and `(portal)` segments                                      | ~10 min | 4       | **Done** |
| 3   | Remove 3 unused font families from `tailwind.config.ts`                                      | ~5 min  | 4       | **Done** |
| 4   | Replace 2 `<img>` with `next/image` in newsroom create page                                  | ~10 min | 4       | **Done** |
| 5   | Add `year`/`month` params to `getRevenueByProgrammeType()` and `getPaymentStatusBreakdown()` | ~30 min | 5       | **Done** |
| 6   | Add audit log CSV export endpoint                                                            | ~30 min | 6       | **Done** |

### Tier 2 — Medium Tasks (1-4 hours each)

| #   | Item                                                           | Est.    | Section | Status   |
| --- | -------------------------------------------------------------- | ------- | ------- | -------- |
| 7   | Rate limiting on `submit-payment-proof` and public routes      | ~1-2 hr | 4       | **Done** |
| 8   | Break up `getDashboardData` (183 lines) into helper functions  | ~1-2 hr | 4       | **Done** |
| 9   | Centralize hardcoded status arrays with Prisma-typed constants | ~2-3 hr | 4       | **Done** |
| 10  | Adopt granular permissions in critical staff endpoints         | ~2-3 hr | 6       | **Done** |
| 11  | Scheduling conflict detection (examiner + venue time overlap)  | ~2-3 hr | 1       | **Done** |

### Tier 3 — Medium-Large Features (4-8 hours each)

| #   | Item                                               | Est.    | Section | Status            |
| --- | -------------------------------------------------- | ------- | ------- | ----------------- |
| 12  | Student classmate/batch directory with RLS scoping | ~4-5 hr | 2       | **Done**          |
| 13  | Scheduled PDF reports via email (cron + Resend)    | ~4-5 hr | 3       | **Done** (hidden) |
| 14  | Invoice PDF generation with auto-numbering         | ~4-5 hr | 5       | **Done** (hidden) |
| 15  | Year-over-year comparison dashboard                | ~4-5 hr | 3       | **Done**          |

### Tier 4 — Large Features (1-3 days each)

| #   | Item                                                        | Est.      | Section | Status   |
| --- | ----------------------------------------------------------- | --------- | ------- | -------- |
| 16  | Revenue forecasting / predictive analytics                  | ~1-2 days | 3       | **Done** |
| 17  | Batch enrollment interface (bulk class assignment)          | ~1-2 days | 1       | **Done** |
| 18  | Visual weekly schedule UI (calendar-based class scheduling) | ~1-2 days | 1       | **Done** |
| 19  | Classroom/room mapping + capacity enforcement               | ~1 day    | 1       | **Done** |
| 20  | Stripe/Paystack checkout flow for students                  | ~2-3 days | 5       |          |

### Tier 5 — Major Projects (3+ days each)

| #   | Item                                                   | Est.      | Section | Status   |
| --- | ------------------------------------------------------ | --------- | ------- | -------- |
| 21  | Two-factor authentication for staff                    | ~3-4 days | 6       | **Done** |
| 22  | Seating arrangements (interactive floor plan designer) | ~5+ days  | 1       | **Done** |
| 23  | Pre-requisite validation + auto-enrollment logic       | ~3-4 days | 1       | **Done** |
| 24  | Audit log retention policies and archival              | ~1-2 days | 6       | **Done** |

---

## 🔒 Hidden Features (To Unhide Later)

The following features are fully implemented but temporarily hidden. To re-enable, follow the steps below.

### 1. Scheduled PDF Reports (Item 13)

- **File**: `app/api/cron/scheduled-reports/route.ts`
- **How**: Remove lines 13-14 (`return NextResponse.json({ success: true, message: 'Feature disabled' })`). The rest of the handler is live code below.

### 2. Student Invoices & PDF Generation (Item 14)

Three files to touch:

1.  **Sidebar** — `app/student/_components/StudentSidebar.tsx`
    - Uncomment line 54 (`{ label: 'My Invoices', ... }`)
2.  **Invoices page** — `app/student/invoices/page.tsx`
    - Delete the active `StudentInvoicesPage` function (the one-liner with `redirect`).
    - Uncomment the `/* ... */` block containing `StudentInvoicesPageFull` and rename it to `StudentInvoicesPage`.
    - Uncomment the imports at the top of the file.
3.  **PDF download API** — `app/api/student/invoices/[id]/download/route.ts`
    - Delete the active `GET()` function (the one-liner returning 403).
    - Uncomment the `/* ... */` block containing the full `GET` handler.
    - Uncomment the imports at the top of the file.
