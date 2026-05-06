# Future Plans

This document tracks planned features and improvements for the Aerojet Academy platform.
Items are grouped by original category then ordered by implementation effort in the **Priority Queue** at the bottom.

**Last audited:** 2026-05-06

---

## 🎓 1. Academy Class Management Redesign

### Student & Batch Enrollment
- [ ] **Batch Selection**: Bulk-selection interface to enroll entire batches (Academic Year + Semester cohorts) into a class in one action.
- [ ] **Roster Management**: Comprehensive student list view within each class with status tracking (Enrolled, Dropped, Completed).
- [ ] **Auto-Enrollment Logic**: Link classes to specific student qualifications or pathway requirements.

### Pathway & Academic Context
- [ ] **Pathway Constraints**: Restrict class visibility or enrollment based on the student's assigned `StudyPathway`.
- [ ] **Pre-requisite Validation**: Automatic checking if students meet the course requirements before allowing class assignment.

### Physical Resource Management
- [ ] **Classroom Mapping**: Assign classes to specific physical rooms or labs in the academy.
- [ ] **Capacity Enforcement**: Real-time validation of `maxStudents` against physical room seating capacity.
- [ ] **Seating Arrangements**: Interactive floor plan / seating chart designer with drag-and-drop student assignment and visual occupancy heatmaps.

### Enhanced Scheduling
- [ ] **Weekly Schedule UI**: Replace JSON configuration with a visual calendar/grid picker for daily instruction hours.
- [x] ~~**Conflict Detection**: Time-based examiner overlap (respects `maxParallelSittings`) and venue overlap detection~~ *(done 2026-05-06)*
- [ ] **Holiday/Break Exclusion**: Automatically exclude academy holidays from the session count.

---

## 👥 2. Student Peer Visibility

### Classmate Directory
- [ ] **Class Roster View**: Students assigned to a class can view a directory of classmates with profile photos/avatars and full names.
- [ ] **Sort & Filter**: Sortable by name, with search functionality.
- [ ] **Profile Cards**: Compact card layout with student avatar, name, and study pathway badge.

### Year Group / Batch Directory
- [ ] **Batch-level View**: Toggle between viewing just their class and the full intake batch.
- [ ] **Class Filtering**: Tabs/filters to switch between own class and full batch.
- [ ] **Privacy Controls**: Only enrolled students within the same academic year or intake group can see each other. Enforced at API level via RLS or scoped queries.

---

## 📊 3. Advanced Analytics & Reporting

### Predictive Analytics
- [ ] Revenue forecasting based on historical exam enrollment trends.
- [ ] Enrollment pipeline predictions (applicant to student conversion rates).

### Automated Reporting
- [ ] Scheduled PDF reports for board members (Revenue, Enrollment, Attendance).
- [ ] Email-based report delivery on configurable schedules (weekly/monthly).

### Performance Benchmarking
- [ ] Year-over-year comparison dashboards.
- [ ] Automatic trend detection with anomaly highlighting.

---

## 🏗️ 4. Structural Improvements (P2 Backlog)

### Code Quality
- [x] ~~Break up long functions — `getDashboardData` refactored into helper functions~~ *(done 2026-05-06)*
- [ ] Break up `UsersTable` (380 lines)
- [x] ~~Add `error.tsx` in `(auth)` segment~~ *(done 2026-05-06)*
- [x] ~~Add `not-found.tsx` in `(auth)` and `(portal)` segments~~ *(done 2026-05-06)*
- [x] ~~Remove dead config — 3 unused font families in `tailwind.config.ts`~~ *(done 2026-05-06)*

### Polish
- [x] ~~Centralize hardcoded values — status arrays now in `lib/utils/constants.ts` with Prisma-typed constants~~ *(done 2026-05-06)*
- [x] ~~Replace `<img>` with `next/image` — 2 instances in newsroom create page~~ *(done 2026-05-06)*
- [x] ~~Rate limiting — `submit-payment-proof` rate-limited to 5/hr per IP~~ *(done 2026-05-06)*

---

## 💰 5. Financial System Enhancements

### Revenue by Programme Type — Year/Month Scoping
- [x] ~~`getRevenueByProgrammeType()` and `getPaymentStatusBreakdown()` now accept `year`/`month` params~~ *(done 2026-05-06)*

### Invoice Generation
- [ ] Auto-generate PDF invoices for enrollment payments.
- [ ] Invoice numbering system tied to academic year. *(Invoice model exists in schema — needs generation logic)*

### Payment Gateway Integration
- [ ] Direct online payment via Stripe/Paystack instead of manual proof uploads. *(Stripe webhook handler exists, checkout flow not built)*
- [ ] Automatic reconciliation on payment webhook confirmation.

---

## 🔐 6. Security & Compliance

### Audit Trail Enhancements
- [x] ~~Immutable audit log CSV export for regulatory compliance~~ *(done 2026-05-06)*
- [ ] Audit log retention policies and archival.

### Access Control
- [x] ~~Adopt granular permissions (`requirePermission()`) in critical staff endpoints — audit logs, go/no-go, role changes, enrollment approval, payment approval/rejection~~ *(done 2026-05-06)*
- [ ] Two-factor authentication for staff accounts.

---

## 📋 Priority Implementation Queue

All remaining items ordered from **quickest/easiest** to **longest/hardest**.
Use this queue to pick the next item to implement.

### Tier 1 — Quick Wins (under 1 hour each)

| # | Item | Est. | Section | Status |
|---|------|------|---------|--------|
| 1 | Add `error.tsx` in `(auth)` segment | ~10 min | 4 | **Done** |
| 2 | Add `not-found.tsx` in `(auth)` and `(portal)` segments | ~10 min | 4 | **Done** |
| 3 | Remove 3 unused font families from `tailwind.config.ts` | ~5 min | 4 | **Done** |
| 4 | Replace 2 `<img>` with `next/image` in newsroom create page | ~10 min | 4 | **Done** |
| 5 | Add `year`/`month` params to `getRevenueByProgrammeType()` and `getPaymentStatusBreakdown()` | ~30 min | 5 | **Done** |
| 6 | Add audit log CSV export endpoint | ~30 min | 6 | **Done** |

### Tier 2 — Medium Tasks (1-4 hours each)

| # | Item | Est. | Section | Status |
|---|------|------|---------|--------|
| 7 | Rate limiting on `submit-payment-proof` and public routes | ~1-2 hr | 4 | **Done** |
| 8 | Break up `getDashboardData` (183 lines) into helper functions | ~1-2 hr | 4 | **Done** |
| 9 | Centralize hardcoded status arrays with Prisma-typed constants | ~2-3 hr | 4 | **Done** |
| 10 | Adopt granular permissions in critical staff endpoints | ~2-3 hr | 6 | **Done** |
| 11 | Scheduling conflict detection (examiner + venue time overlap) | ~2-3 hr | 1 | **Done** |

### Tier 3 — Medium-Large Features (4-8 hours each)

| # | Item | Est. | Section |
|---|------|------|---------|
| 12 | Student classmate/batch directory with RLS scoping | ~4-5 hr | 2 |
| 13 | Scheduled PDF reports via email (cron + Resend) | ~4-5 hr | 3 |
| 14 | Invoice PDF generation with auto-numbering | ~4-5 hr | 5 |
| 15 | Year-over-year comparison dashboard | ~4-5 hr | 3 |

### Tier 4 — Large Features (1-3 days each)

| # | Item | Est. | Section |
|---|------|------|---------|
| 16 | Revenue forecasting / predictive analytics | ~1-2 days | 3 |
| 17 | Batch enrollment interface (bulk class assignment) | ~1-2 days | 1 |
| 18 | Visual weekly schedule UI (calendar-based class scheduling) | ~1-2 days | 1 |
| 19 | Classroom/room mapping + capacity enforcement | ~1 day | 1 |
| 20 | Stripe/Paystack checkout flow for students | ~2-3 days | 5 |

### Tier 5 — Major Projects (3+ days each)

| # | Item | Est. | Section |
|---|------|------|---------|
| 21 | Two-factor authentication for staff | ~3-4 days | 6 |
| 22 | Seating arrangements (interactive floor plan designer) | ~5+ days | 1 |
| 23 | Pre-requisite validation + auto-enrollment logic | ~3-4 days | 1 |
| 24 | Audit log retention policies and archival | ~1-2 days | 6 |
