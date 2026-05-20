# Design-Gap Audit — Implementation Status

Cross-check of every row in [docs/design-gap-audit.html](./design-gap-audit.html)
against the codebase as of the latest commit on `main`.

**Legend**: ✅ Done · 🟡 Partial · ⏸️ Deferred (intentionally) · 🔴 Stale (audit
needs revision).

## Section A — Staff/Admin Portal (post-audit additions)

| # | Audit item | Status | Evidence |
|---|---|---|---|
| A.1 | Dashboard alerts + trends + AlertsCenter (.b "Standard") | ✅ | [lib/analytics/dashboard-alerts.ts](../../lib/analytics/dashboard-alerts.ts), [app/staff/dashboard/_components/AlertsCenter.tsx](../../app/staff/dashboard/_components/AlertsCenter.tsx); wired in [app/staff/dashboard/page.tsx:209](../../app/staff/dashboard/page.tsx#L209) with 60s `router.refresh()` poll and 5-min `unstable_cache`. 5 alert checks (overdue payments, overdue DSR, fraud-flagged referrals, expiring bundles, mirror backlog). |
| A.2 | Role transition wizard + dry-run preview (.c) | ✅ | New endpoint [app/api/staff/users/[id]/role/preview/route.ts](../../app/api/staff/users/%5Bid%5D/role/preview/route.ts) computes side-effects without mutating. 3-step wizard at [app/staff/users/[id]/_components/ChangeRoleDialog.tsx](../../app/staff/users/%5Bid%5D/_components/ChangeRoleDialog.tsx) (select → preview → typed-name confirm). Docs at [docs/role-transitions.md](../guides/role-transitions.md). |
| A.3 | Cross-class conflict detection matrix (.c) | ✅ | [lib/scheduling/recurrence.ts](../../lib/scheduling/recurrence.ts) expands recurring classes; [lib/scheduling/conflicts.ts](../../lib/scheduling/conflicts.ts) detects instructor + classroom overlaps. UI at [app/staff/timetable/conflicts/page.tsx](../../app/staff/timetable/conflicts/page.tsx) with date-range matrix grid + drill-down table. 409 pre-check wired into [app/api/staff/classes/route.ts:71](../../app/api/staff/classes/route.ts#L71) (`force:true` to override). |
| A.4 | Full GDPR module (.c) | ✅ | Models: `DataSubjectRequest`, `RetentionPolicy`. Library: [lib/gdpr/export.ts](../../lib/gdpr/export.ts) (Art 15), [lib/gdpr/anonymise.ts](../../lib/gdpr/anonymise.ts) (Art 17), [lib/gdpr/retention.ts](../../lib/gdpr/retention.ts). UI: [/staff/gdpr](../../app/staff/gdpr/page.tsx) queue + [/staff/settings/retention](../../app/staff/settings/retention/page.tsx) policy editor. Endpoints: `users/[id]/gdpr-export`, `users/[id]/anonymise`, `gdpr/requests`, `settings/retention`. Weekly cron at [app/api/cron/gdpr-retention/route.ts](../../app/api/cron/gdpr-retention/route.ts) (Mondays 03:00 UTC). |
| A.5 | Full referrals management (.c) | ✅ | Schema adds `Referral.fraudScore/fraudReasons/reviewedById/reviewedAt/signupIpHash/signupUaHash` + `ReferralPayout` model + `DISQUALIFIED` referral status + `ReferralStatus`/`ReferralPayoutStatus` enums. Logic in [lib/referral/admin.ts](../../lib/referral/admin.ts) (`runFraudHeuristics`, `disqualifyReferral`, `revokeAmbassador`, `createPayoutRun`, `exportPayoutCsv`). UI: [/staff/referrals](../../app/staff/referrals/page.tsx) (filters + bulk disqualify + fraud column + ambassador revoke) and [/staff/referrals/payouts](../../app/staff/referrals/payouts/page.tsx) (queue + CSV export). New `MANAGE_REFERRALS` permission key. |
| A.6 | Full RBAC builder (.c) | ✅ | Models: `Permission`, `RoleGrant`, `PermissionScope` enum. Registry: [lib/auth/permission-registry.ts](../../lib/auth/permission-registry.ts) (cached resolve via `unstable_cache`, role + user scoping, legacy `StaffProfile.permissions` fallback). Route bindings: [lib/auth/permission-routes.ts](../../lib/auth/permission-routes.ts). `requirePermission(key)` rewritten to consult registry — accepts both `PERMISSIONS` enum and runtime-added custom keys. Admin UI at [/staff/admin/permissions](../../app/staff/admin/permissions/page.tsx) with Registry / Grants / Route-bindings tabs. APIs: `/api/staff/admin/permissions`, `/api/staff/admin/permissions/[key]`, `/api/staff/admin/permissions/grants`, `/api/staff/admin/permissions/grants/[id]`. |

## Section B — Neon ↔ Supabase sync

| # | Item | Status | Evidence |
|---|---|---|---|
| B.3 | Postgres logical replication (chosen over app dual-write) | 🟡 | App-side complete: `postdb:push` script in [package.json:26](../../package.json#L26) auto-mirrors schema; sync-check library + cron at [lib/supabase/sync-check.ts](../../lib/supabase/sync-check.ts) + [app/api/cron/sync-check/route.ts](../../app/api/cron/sync-check/route.ts) (Mondays 04:00 UTC). Runbook at [docs/neon-supabase-logical-replication.md](../guides/neon-supabase-logical-replication.md). **Manual step pending**: run the SQL in the runbook on Neon + Supabase (publication + subscription); cannot be done from this environment because it requires DB-admin credentials. The dormant `lib/supabase/dual-write.ts` and `lib/prisma/supabase-sync-extension.ts` remain as fallback. |

## Section C — UploadThing ↔ Supabase storage mirror

| # | Item | Status | Evidence |
|---|---|---|---|
| C.1 | Wire every UT upload through `recordFileUpload()` | ✅ | [lib/storage/file-upload-record.ts](../../lib/storage/file-upload-record.ts) inserts a `FileUpload` row from each `onUploadComplete` in [app/api/uploadthing/core.ts](../../app/api/uploadthing/core.ts). New fields on `FileUpload`: `route`, `uploadthingUrl`, `uploadthingKey`, `supabasePath`, `mirroredAt`. |
| C.3 | Nightly reconciliation + 30-day temp sweep | ✅ | [lib/storage/uploadthing-mirror.ts](../../lib/storage/uploadthing-mirror.ts) (`mirrorBatch` + `sweepTempFolders`). Cron at [app/api/cron/supabase-mirror/route.ts](../../app/api/cron/supabase-mirror/route.ts) scheduled `30 4 * * *` in [vercel.json](../../vercel.json). |

## Section D — Next.js 16 deprecation

| # | Item | Status | Evidence |
|---|---|---|---|
| D | `middleware` → `proxy` rename | ✅ | [middleware.ts](../../middleware.ts) renamed to [proxy.ts](../../proxy.ts); exported function renamed `middleware` → `proxy`. Build output now reports `ƒ Proxy (Middleware)`. Helpers at `lib/auth/middleware-helpers.ts` and `utils/supabase/middleware.ts` are intentionally NOT wired (they're ad-hoc utilities). |

## Section E — Hygiene

| # | Item | Status | Evidence |
|---|---|---|---|
| E.1 | Cross-check doc | ✅ | This file. |
| E.2 | Clean `bun run build` | ✅ | Build exits 0 — `✓ Compiled successfully in 86s`, 219 pages, no warnings. |
| E.3 | Tests pass | ✅ | `bun run test --run` — 14 files, 102 tests, all green. |
| E.4 | Clean `bun run type-check` | ✅ | `npx tsc --noEmit` exits 0 after fixes (was: 18 errors before this audit; now: 0). |

---

## Carried over from the original 42-row gap audit

The earlier session resolved the bulk of the original `design-gap-audit.html`
list. The status of every original row is preserved here for completeness.

### 1 — Exam pools / bundles

- **1a Pool join with bundle**: ✅ [lib/pools/join.ts](../../lib/pools/join.ts) passes `bundleId` on booking create.
- **1b Pool list pricing config**: ✅ pricing engine `lib/pools/pricing-config.ts` powers `/student/exams`.
- **1c Free resit included on bundle**: ✅ [lib/pools/bundles.ts](../../lib/pools/bundles.ts) seeds `freeResitsIncluded`; consumed by `bookResitExam` in [lib/enrollment/exams.ts](../../lib/enrollment/exams.ts).

### 2 — Exam sitting workflow

- **2a Sitting → result chain**: ✅ already existed pre-audit (engine, fulfillment, scheduler modules).

### 4 — Student portal

- **4a/4b Wallet display**: ✅ pre-existing.
- **4c Certificate eligibility (pathway/funding/bond rules)**: ✅ [lib/certificates/eligibility.ts](../../lib/certificates/eligibility.ts); wired into [/student/certificates](../../app/student/certificates/page.tsx) and staff [CertificateReleaseControl](../../app/staff/students/%5Bid%5D/_components/CertificateReleaseControl.tsx).
- **4d Bundle/sitting/checklist on booking detail**: ✅ [/student/exam-bookings/[id]](../../app/student/exam-bookings/%5Bid%5D/page.tsx).
- **4e Resit booking tab reads real bundle data**: ✅ [ResitBookingTab](../../app/student/exams/_components/ResitBookingTab.tsx).
- **4f/4g Wallet transactions scoped to legitimate movements**: ✅ [/student/wallet](../../app/student/wallet/page.tsx).

### 5 — Student lifecycle

- **5a/g/h/j/k/l (deferred)**: ⏸️ documented in plan; not in scope.
- **5b Refunds with reason/approval**: ✅ [lib/refund/actions.ts](../../lib/refund/actions.ts) + [/staff/finance/refunds](../../app/staff/finance/refunds/page.tsx).
- **5c Reconciliation**: ✅ pre-existing.
- **5d No GPA (147 facility)**: ✅ confirmed — no GPA fields anywhere.
- **5e Withdrawal workflow (staff confirm + admin approval)**: ✅ [lib/withdrawal/actions.ts](../../lib/withdrawal/actions.ts) + [/student/withdrawal](../../app/student/withdrawal/page.tsx) + [/staff/withdrawals](../../app/staff/withdrawals/page.tsx).
- **5f Bulk ops**: ✅ pre-existing.
- **5i Messaging scoped to admin/staff/assigned/current+prev instructor**: ✅ [app/student/actions.ts](../../app/student/actions.ts) `sendMessage`.

### 6 — Grading

- **6a Instructor internal CA only; EASA grades by admin/examiner**: ✅ [Grade.category](../../prisma/schema.prisma) enum + [grades route](../../app/api/instructor/classes/%5Bid%5D/grades/route.ts).
- **6b/c/d Instructor portal additions**: ✅ availability, materials, metrics pages added.

### 7 — Examiner

- **7a Results entry + availability only (suntech-bc.com handles lifecycle)**: ✅ [/examiner/results](../../app/examiner/results/page.tsx) + [/examiner/availability](../../app/examiner/availability/page.tsx).
- **7b Examiner sidebar**: ✅ [ExaminerSidebar](../../app/examiner/_components/ExaminerSidebar.tsx).

### 8 — Admissions

- **8a Toggleable pipeline (full vs simplified)**: ✅ admin toggle in [settings page](../../app/staff/settings/page.tsx) + [SettingsTabs](../../app/staff/settings/_components/SettingsTabs.tsx) Admissions tab.
- **8b/8c Pipeline + admissions UIs**: ✅ pre-existing (audit was stale).

### 9 — Attendance

- **9c Admin-configurable threshold vs EASA floor**: ✅ [lib/attendance.ts](../../lib/attendance.ts) `getAttendanceThreshold()`.

### 10 — Payments

- **10a Stripe**: ⏸️ on hold per business decision. SDK installed, CSP allows js.stripe.com, no integration code.

### 12 — Part-145 linkage

- **12 Transfer to linked 145 (not full 145 build)**: ✅ [Partner145Organisation](../../prisma/schema.prisma) + [Maintenance145Transfer](../../prisma/schema.prisma) models, [lib/part145/actions.ts](../../lib/part145/actions.ts), [/staff/part-145](../../app/staff/part-145/page.tsx).

### 15 — Storage

- **15b Supabase as structured doc store**: ✅ [lib/storage/supabase-storage.ts](../../lib/storage/supabase-storage.ts) — bucket taxonomy, signed URLs. Used by Document Vault ([/staff/documents](../../app/staff/documents/page.tsx) + [/student/documents](../../app/student/documents/page.tsx)) and [Teaching Materials](../../app/instructor/materials/page.tsx). Now extended (this session) with UploadThing↔Supabase mirror — see Section C.

---

## Verification log (this session)

| Check | Result |
|---|---|
| `bun run db:generate` | ✓ Generated Prisma Client (v7.8.0) |
| `bun run db:push` | ✓ Database in sync (schema delta applied) |
| `bun run type-check` | ✓ exit 0 — 0 errors |
| `bun run test --run` | ✓ 14 files / 102 tests pass |
| `bun run build` | ✓ Compiled successfully in 86s, 219 pages, `Proxy (Middleware)` registered |
