# Kilo Code Session Inventory & Recovery Reference

> **Purpose:** Complete inventory of all Kilo Code session prompts, agent tasks, and document/plan/test file paths created across sessions. Use this to rebuild lost uncommitted files.
>
> **Last updated:** 2026-09-01
> **Sessions scanned:** 354 (all accessible local sessions)

---

## 1. SESSION PROMPTS — What You Asked Agents to Do

### Session: Multi-agent portal audit plan (`ses_fbc4b22d4ffevlSRC1e7ItB5xJ`)
**Prompt:** "i think it is time to use more than 5 skills and agents to do an audit of all the portals but we have to plan and start the portals one by one. maybe with the staff portal first. we will use all individual agents available and related to the portals to run audits and produce pr docs on the auditing for me to confirm is the fixes, feature additions or suggestions are relevant and should be worked on..."

**Subagent tasks spawned:**
- Staff TypeScript/React Auditor → `docs/audits/portal-audits/staff/staff-typescript.md`
- Staff Performance Auditor → `docs/audits/portal-audits/staff/staff-performance.md`
- Staff Security Auditor → `docs/audits/portal-audits/staff/staff-security.md`
- Staff UI/UX Auditor → `docs/audits/portal-audits/staff/staff-ui-ux.md`
- Staff Code Quality Auditor → `docs/audits/portal-audits/staff/staff-code-quality.md`
- Staff EASA Compliance Auditor → `docs/audits/portal-audits/staff/staff-easa.md`
- Synthesize cross-portal audit findings → `ses_fb3a57344ffeVeLRyAapNjHH0R`

**Follow-up prompts:**
- "lets go back to the original prompt i asked. have all the audits been done on all the portals and all the issues documented, fixed, llm council verified three times and the documents checklisted/updated?"
- "1. h1, do what is recommended that wont break any functions currently active / 2. h2 do the recommended but check if it doesnt affect the different levels of staff / 3. h12 add a page or tab where it can be previewed before generation / 4. l2 i prefer smaller texts / 5. l3 wrap all in shared — fix all of the issues then follow the plan and run the llm council multiple time when done"
- "add updating all the docs created to the tasks"

### Session: Part 147 anti-cheat exam system design LLM audit (`ses_facfa8554ffe3V0KwRPZdpyrJO`)
**Prompt:** "do websearches and extensive system of architecture and system design plans for an online(or intranet) anticheat examination system for schools(aviation schools(part 147)) such as what Suntech Aviation, Slovenia uses privately... when done create a docs of the best way to achieve all the anticheat features... when done use the llm council to audit the plan 3 times and verify it"

**Subagent tasks spawned:**
- LLM Council Audit 1 — Security & Regulatory
- LLM Council Audit 2 — Architecture & UX
- LLM Council Audit 3 — Implementation Feasibility

**Follow-up prompt:** "finish the document, ensuring nothing is left out and use the llm council to do a verification of the comparison and the consolidated document."

### Session: Execute internal exam UI plan (`ses_fac237f4cffeSosyRaxVGGukfD`)
**Prompt:** "implement this plan C:\Projects\aerojet-academy\docs\plans\internal-exam-system-ui-plan.md completely as a swarm orchestrator without deferring tasks..."

**Subagent tasks spawned:**
- Explore internal exam codebase
- Explore auth/permissions/RBAC
- Explore UI components and patterns
- Explore Prisma schema quickly
- Explore exam API routes
- Explore instructor/staff portal UI
- Implement Prisma schema changes

**Follow-up prompts:**
- "what is SEB again? create plans for the SEB config deployments, certificate template and pdf generation, the tests and the implement all the plans accordingly"
- "do all that is remaining. i have updated the supabase connection string... also use supabase skills or mcp to enable the reatime... also run the necessary sqls neeeded for the revoke rls"
- "for grading requirements in easa exam compliance md easa certification should be 75%. also mark the compliance checklist if its done."
- "audit the rls completely and see what is needed and what isnt since we are not using rls in major parts of all portals"

### Session: Next.js dynamic route slug conflict (`ses_fa8bb1896ffeHGo01SWwrTEMwV`)
**Prompt:** "bun dev" (reported errors, then asked for fixes)

**Follow-up prompts:**
- "add sorting to all tables in the codebase. i am currently looking at the enrollments table and i cannot order by enrolled date. audit all tables and add order by to the column titles"
- "if there is a pending item in course enrollment under operations, how would i know when i expand the operations tab?"

### Session: Recovering untracked git changes (`ses_fa3c23858ffefBQh5iLAt5673c`)
**Prompt:** "please check if i still have all 1000+ untracked changes still available or committed. if not what are the measures to take to restore them"

**Follow-up prompts:**
- "try to find all the files over 1090+. this is what the agent that deleted the files found. create a concrete plan that will work on how to recover them locally."
- "most of the work was done in kilo code so please check where kilo code writes its temporary or backup data to so we can restore it"
- "eventually i want all my unsaved changes back, because nothing was committed to any github branch. do work until you restore all. another agent is writing a doc about all the files and their paths that were lost. you can scan /docs periodically to find them and see if you can recover any of them"
- "create a doc in docs off all the files and their paths that could not be recovered"

### Session: Verify aerojet-academy compliance docs vs codebase (`ses_fb57b1fceffe6TBdU6HcLKKdoE`)
**Prompt:** "lets do some audit of the tour in all portals and plan an upgrade or improvement based on functions in the individual portal so they are with very important and reliable information..."

**Follow-up prompt:** "review the as any cast findings, and fix them all"

### Session: Verifying aerojet-academy docs accuracy (`ses_fb578102fffeFqduLYBix7d4Ga`)
**Prompt:** (Verification of all 10 docs/guides files against the current codebase)

### Session: Analytics features documentation (`ses_fbf5d8374ffeNIKRXZkDSnAEWP`)
**Prompt:** "create a complete plan of data that should be distinct, added or removed from both pages" (Reports vs Analytics)

### Session: Doc editor verify consistency (`ses_fb55b3a2cffeKBNfrDeyWSFIui`)
**Prompt:** (Cross-document consistency verification)

### Session: Explore internal exam codebase (`ses_fac2233b5fferyxUG1RKH5RYeB`)
**Prompt:** (Exploration of internal exam data models, API routes, UI components, auth integration, EASA rules engine, audit logging, test coverage)

---

## 2. AUDIT DOCUMENTS Created by Agents

### Staff Portal Audits (all in `docs/audits/portal-audits/staff/`)
| File | Description | Status |
|------|-------------|--------|
| `staff-typescript.md` | TypeScript/React audit — 231 `any` occurrences, 20 routes missing `loading.tsx` | ✅ Recovered |
| `staff-performance.md` | Performance audit — 14 findings (query optimization, caching, pagination) | ✅ Recovered |
| `staff-security.md` | Security audit — 6 findings (auth guards, XSS, CSP, rate limiting) | ✅ Recovered |
| `staff-ui-ux.md` | UI/UX audit — 11 findings (contrast, dark mode, responsive, ProtectedImage) | ✅ Recovered |
| `staff-code-quality.md` | Code quality — 24 files >500 lines, 80 routes missing boundaries, duplication | ✅ Recovered |
| `staff-easa.md` | EASA compliance — 3 Critical, 6 High, 7 Medium, 2 Low | ✅ Recovered |
| `staff-portal-audit-2026-08-27.md` | **Consolidated** staff audit (3 Critical, 13 High, 24 Medium, 18 Low) | ✅ Recovered |

### Cross-Portal Audit Synthesis
| File | Description |
|------|-------------|
| `docs/audits/portal-audits/` (synthesis) | Top 15 prioritized fixes across all portals, batch implementation plan |

### Other Audit Documents Referenced
| File | Description |
|------|-------------|
| `docs/audits/2026-05-21-internal-exams.md` | Prior internal exams audit (15 findings + 5 new EXAM-16..20) |
| `docs/audits/2026-08-30-portal-qa-issues.md` | Portal QA issues audit |
| `docs/audits/API-AUDIT-2026-08-29.md` | API audit |
| `docs/audits/CENTRAL-TRACKER.md` | Central audit tracker |

---

## 3. PLAN FILES Created by Agents

### In `docs/plans/`
| File | Description | Status |
|------|-------------|--------|
| `internal-exam-system-ui-plan.md` | **Master plan** — 23 sections, 2177 lines, EASA Part-147/66 compliant exams | ✅ On disk (open tab) |
| `anticheat-exam-system-plan.md` | Anti-cheat exam system architecture (source: `.kilo/plans/1788099263147-anticheat-exam-system-plan.md`) | ✅ On disk (open tab) |
| `anticheat-vs-internal-exam-comparison.md` | Comparison & integration report | ✅ On disk (open tab) |
| `ACCESSIBILITY.md` | WCAG compliance documentation | ✅ On disk (open tab) |
| `seb-and-certificates-plan.md` | SEB config deployment + certificate template/PDF generation plan | ✅ Created |
| `implementation-gap-report.md` | Section-by-section audit evidence of plan vs implementation | ✅ Created |
| `certificate-pdf-generation-plan.md` | Certificate PDF generation plan | ✅ Created |
| `seb-config-deployment-plan.md` | SEB configuration deployment plan | ✅ Created |
| `seb-certificates-tests-plan.md` | SEB and certificates test plan | ✅ Created |
| `test-suite-remediation.md` | Test suite remediation plan | ✅ Created |

### In `.kilo/plans/`
| File | Description |
|------|-------------|
| `1787842321707-portal-audit-orchestration.md` | Portal audit orchestration plan (all agents) |
| `1788099263147-anticheat-exam-system-plan.md` | Anti-cheat exam system plan (canonical source) |
| `1788213139626-staff-exam-preview-lockdown-ui.md` | Staff exam preview lockdown UI plan |

---

## 4. GUIDE FILES Created/Updated by Agents

### In `docs/guides/`
| File | Description | Status |
|------|-------------|--------|
| `sortable-tables.md` | Sortable table pattern doc (server-side sort with `SortableTh` + `buildOrderBy`) | ✅ Created |
| `analytics-features.md` | Analytics features documentation & monitoring guide | ✅ Created |
| `easa-exam-compliance.md` | EASA Part-147/Part-66 compliance guide (75% pass mark) | ✅ Created |
| `branch-strategy.md` | Branch strategy documentation | ✅ Created |
| `teamcity-evaluation.md` | TeamCity evaluation | ✅ Created |
| `lost-files-recovery-manifest.md` | Lost files recovery manifest (2026-09-01 catastrophic revert) | ✅ Created |

### Updated Architecture Docs
| File | Description |
|------|-------------|
| `docs/architecture/system-overview.md` | Updated dual-client description |
| `docs/architecture/applicant-portal.md` | Applicant portal architecture |

### Updated Guide Docs
| File | Description |
|------|-------------|
| `docs/guides/handover.md` | Updated Security & RLS Implementation section |
| `docs/guides/setup.md` | Fixed `bun test` → `bun run test`, `.env.local` → `.env` |

---

## 5. TEST FILES Created by Agents

### E2E Tests (Playwright)
| File | Description | Status |
|------|-------------|--------|
| `tests/e2e/anticheat-security.spec.ts` | Anti-cheat security tests (fullscreen, clipboard, keyboard, tab-switch, multi-tab) | ✅ Recovered |
| `tests/e2e/app-tour-verification.spec.ts` | App tour verification | ✅ Recovered |
| `tests/e2e/applicant-critical-flows.spec.ts` | Applicant critical flows | ✅ Recovered |
| `tests/e2e/applicant-journey.spec.ts` | Applicant journey | ✅ Recovered |
| `tests/e2e/portal-explore.spec.ts` | Portal exploration | ✅ Recovered |

### Integration Tests
| File | Description | Status |
|------|-------------|--------|
| `tests/integration/api/wallet-topup.test.ts` | Wallet top-up API test | ✅ Recovered |
| `tests/integration/api/student-exams.test.ts` | Student exams API test | ✅ Recovered |
| `tests/integration/api/examiner-results.test.ts` | Examiner results API test | ✅ Recovered |
| `tests/integration/api/staff-exam-sittings.test.ts` | Staff exam sittings API test | ✅ Recovered |
| `tests/integration/api/pool-confirmation.test.ts` | Pool confirmation API test | ✅ Recovered |
| `tests/integration/api/pools-pricing.test.ts` | Pools pricing API test | ✅ Recovered |
| `tests/integration/api/applicant-exams.test.ts` | Applicant exams API test | ✅ Recovered |

### Unit Tests
| File | Description | Status |
|------|-------------|--------|
| `tests/unit/lib/examiner-results.test.ts` | Examiner results lib test | ✅ Recovered |
| `tests/unit/lib/url.test.ts` | URL utility test | ✅ Recovered |
| `tests/unit/lib/string.test.ts` | String utility test | ✅ Recovered |
| `tests/unit/lib/retention.test.ts` | Retention policy test | ✅ Recovered |
| `tests/unit/lib/wallet-balance.test.ts` | Wallet balance test | ✅ Recovered |
| `tests/unit/lib/totp.test.ts` | TOTP test | ✅ Recovered |
| `tests/unit/lib/supabase-client.test.ts` | Supabase client test | ✅ Recovered |
| `tests/unit/lib/storage-proxy.test.ts` | Storage proxy test | ✅ Recovered |
| `tests/unit/lib/analytics-reports.test.ts` | Analytics reports test | ✅ Recovered |
| `tests/unit/lib/welcome-messages.test.ts` | Welcome messages test | ✅ Recovered |

### Component Tests
| File | Description | Status |
|------|-------------|--------|
| `tests/components/statusbadge.test.tsx` | StatusBadge component test | ✅ Recovered |
| `tests/components/AccessGate.test.tsx` | AccessGate component test | ✅ Recovered |
| `tests/components/AdminPrivacyToggle.test.tsx` | AdminPrivacyToggle component test | ✅ Recovered |
| `tests/components/ExamStatusBadge.test.tsx` | ExamStatusBadge component test | ✅ Recovered |
| `tests/components/ExamCharts.test.tsx` | ExamCharts component test | ✅ Recovered |
| `tests/components/PaymentMethodsDisplay.test.tsx` | PaymentMethodsDisplay component test | ✅ Recovered |

### Test Infrastructure
| File | Description | Status |
|------|-------------|--------|
| `tests/factories.ts` | Test factories | ✅ Recovered |
| `tests/setup.tsx` | Test setup (Vitest + Testing Library) | ✅ Recovered |
| `tests/vitest-globals.d.ts` | Vitest global type declarations | ✅ Recovered |
| `tests/__mocks__/` | Module mocks directory | ❌ NOT recovered |

---

## 6. TYPE-CHECK & PERFORMANCE AUDIT FINDINGS

### Type-Check Audit (Staff Portal — `staff-typescript.md`)
- **231 `any` occurrences** across 63 files
- Concentrated in: student/user detail tabs, financial tables, scheduling
- **20 route segments missing `loading.tsx`**
- Files with worst `any` usage: `reports/page.tsx`, `students/import/page.tsx`, `student/academic-calendar/page.tsx`, `student/wallet/page.tsx`, `student/classmates/page.tsx`

### Performance Audit (Staff Portal — `staff-performance.md`)
- **Query Optimization (6):** Full-table loads on `classes/page.tsx`, `exams/page.tsx` RecordsTab; unbounded payment scans in finance/reports
- **Caching (2):** `lib/analytics/reports.ts` and `lib/analytics/metrics.ts` lack `unstable_cache`
- **Dynamic Imports (1):** `AnalyticsDashboardClient.tsx` bundles all 6 Recharts tabs
- **Pagination (3):** Missing `take`/`skip` on classes list, enrollments list, finance pending top-ups
- **Query Consolidation (3):** Duplicate `findUnique` for exam events across 3 event pages

### Code Quality Audit (Staff Portal — `staff-code-quality.md`)
- **24 files exceed 500 lines**; `reports/page.tsx` (1,427 lines), `students/import/page.tsx` (1,139 lines)
- **80 route directories** missing both `error.tsx` and `not-found.tsx`
- **Massive duplication** across four user tables (UsersTable, StudentsTable, InstructorsTable, ExaminersTable)
- **Monolithic `actions.ts`** (1,015 lines)
- **100+ `any` type usages**, **32 `console.error`** statements
- **6 duplicate copies** of `slugify` utility

### Security Audit (Staff Portal — `staff-security.md`)
- **High:** Edge proxy doesn't gate `/staff/*` (ROUTE_ROLE_MAP absent)
- **High:** GET APIs authenticate but don't enforce staff role
- **Medium:** HTML sanitizer too permissive, CSP allows unsafe-inline, zero rate limiting
- **Low:** `limit` param not clamped

---

## 7. FILES RECOVERED FROM KILO DB (952 files)

**Location:** `C:\Users\Pekay\AppData\Local\Temp\kilo\recovered-files\`
**Source:** `C:\Users\Pekay\.local\share\kilo\kilo.db` (2.8 GB SQLite, 588 sessions, 167,690 parts)

### Recovered API Routes
- `app/api/certificates/route.ts`
- `app/api/exams/access-code/validate/route.ts`
- `app/api/health/route.ts`
- `app/api/staff/exams/events/[id]/manifest/route.ts`
- `app/api/staff/exams/internal/banks/[bankid]/questions/...`
- `app/api/staff/ojt/entries/[entryid]/sign/route.ts`
- `app/api/student/exams/internal/start/route.ts`
- `app/api/{analytics,cron/exam-timeout,cron/recover-exams,cron/renewal-reminders}/...`

### Recovered Library Code
- `lib/certificates/generator.ts`
- `lib/internal-exam/import/extractors.ts`
- `lib/internal-exam/seb-config.ts`
- `lib/middleware/seb-detection.ts`
- `lib/server/request-context.ts`
- `lib/staff/errors.ts`
- `lib/student/booking-data.ts`

### Recovered Components
- `components/exam/secureexamclient.tsx`
- `components/tour/tourtrigger.tsx`
- `components/shared/{clientyear,examstatusbadge,metriccard,pagetransition}.tsx`
- `components/ui/chart.tsx`

### Recovered Hooks
- `hooks/use{anticheat,exammonitor,liveexamsessions,pollvisibility,realtimeexammonitor}.ts`

### Recovered Pages
- `app/staff/exams/error.tsx`
- `app/instructor/exams/loading.tsx`
- `app/examiner/results/history/page.tsx`
- `app/examiner/sittings/[id]/page.tsx`
- `app/(public)/exams/[code]/page.tsx`
- `app/(public)/verify/[certificateid]/page.tsx`

### Recovered Scripts
- `scripts/{check-all-columns,check-joyride-classes,check-test-users,check-tour-status,create-grading-function.sql,create-test-users,debug-login,list-routes-to-test,migrate-audit-hash-chain,migrate-prisma,verify-realtime}.ts/.cjs/.js/.sql`

### Recovered Config/Docs
- `accessibility.md` (root)
- `.anchored-summary.md`
- `eslint.config.mjs`
- `tsconfig.staff.json`
- `.kilo/agent/docs-html-builder.md`
- `.kilo/command/skill-update.md`
- `.kilo/plans/1787842321707-portal-audit-orchestration.md`
- `.kilo/plans/1788099263147-anticheat-exam-system-plan.md`
- `.kilo/skills/{aerojet-code-standards,docs-html-build}/`

---

## 8. FILES NOT RECOVERED (Lost — Need Rebuilding)

### Application Code (NEVER committed, only in working tree)
| Category | Lost Files |
|----------|------------|
| **API Routes** | `app/api/staff/exams/internal/banks/[bankId]/{rule-override,schedule,instructors,seb-config,retire}/route.ts` |
| | `app/api/staff/exams/internal/{questions,sessions,preview}/...` |
| | `app/api/staff/ojt/...`, `app/api/staff/notifications/...` |
| | `app/api/student/exams/internal/{access-code,banks,heartbeat,register,resume,review-later,violation}/route.ts` |
| | `app/api/{analytics,certificates,examiner,exams,health,instructor/exams}/...` |
| | `app/api/cron/{exam-timeout,recover-exams,renewal-reminders}/...` |
| **Pages** | `app/examiner/results/history/`, `app/examiner/sittings/`, `app/instructor/exams/` |
| | `app/applicant/exam-only/`, `app/applicant/exam-only/{join-pool,join-waitlist}/` |
| | `app/staff/exams/anticheat/`, `app/staff/exams/internal/banks/`, `app/staff/exams/internal/sessions/` |
| | `app/staff/ojt/[logbookId]/_components/{MentorAssignments,ReviewSignoffPanel}.tsx` |
| **Library** | `lib/certificates/generator.ts`, `lib/hooks/useFetch.ts`, `lib/middleware/`, `lib/server/` |
| | `lib/staff/errors.ts`, `lib/student/{booking-data,error-handler}.ts` |
| **Components** | `components/applicant/`, `components/exam/`, `components/Tour/TourTrigger.tsx` |
| **Hooks** | `hooks/useAntiCheat.ts`, `hooks/useExamMonitor.ts`, `hooks/useLiveExamSessions.ts` |
| | `hooks/usePollVisibility.ts`, `hooks/useRealtimeExamMonitor.ts` |

### Test Infrastructure (NOT in kilo write-log)
| File | Notes |
|------|-------|
| `tests/__mocks__/` | Directory of module mocks |
| `tests/setup.tsx` | May be in edit-only parts |
| `tests/factories.ts` | Test data factories |
| `tests/integration/api/*` (15+ files) | API integration tests |
| `tests/components/*` | Component tests |
| `tests/e2e/*.spec.ts` | Some Playwright specs |

### Documentation (some recovered, some not)
| File | Status |
|------|--------|
| `docs/architecture/` (new files) | ❌ Not recovered |
| `docs/audits/` (new files) | ❌ Not recovered |
| `docs/guides/` (new files) | ❌ Not recovered |
| `docs/html/` (HTML mirror) | ❌ Not recovered |
| `llm_council_framework.html` | ❌ Not recovered |
| `ACCESSIBILITY.md` (root) | ✅ Recovered |
| `supabase/` (whole dir) | ❌ Not recovered |

### Config/Infra
| File | Status |
|------|--------|
| `eslint.config.mjs` | ✅ Recovered |
| `tsconfig.staff.json` | ✅ Recovered |
| `.anchored-summary.md` | ✅ Recovered |
| `supabase/` | ❌ Re-create via `bun run db:push:supabase` |
| `plans/1788213139626-staff-exam-preview-lockdown-ui.md` | ❌ Not recovered |
| `scripts/generate-api-tests.cjs` | ❌ Not recovered |
| `scripts/tour-verification.ts` | ❌ Not recovered |

---

## 9. RECOVERY BRANCHES CREATED

| Branch | Commit | Description |
|--------|--------|-------------|
| `recovery/claude-checkpoint-2` | `73e6d24c` | Cline checkpoint — 617 modified files, 23,903 ins / 11,874 del |
| `recovery/merged-2026-08-30` | — | Merged checkpoint + feature/v1.4.0 + select preview/new-features |
| `recovery/from-kilo-db` | — | 952 files extracted from kilo.db write operations |
| `v1-archive` | `66673915` | Speed updates branch (untracked changes committed here) |
| `feature/v1.4.0-audit-and-refactor` | `9d95af30` | Audit and refactor branch (40 unique files vs dev) |
| `preview/new-features` | — | 533 unique files (mostly aerojet-careers, 11 useful for academy) |

---

## 10. KEY PRIMITIVES & PATTERNS ESTABLISHED

### Sortable Table Pattern
- `components/ui/sortable-th.tsx` — `<SortableTh sortKey label align />` — drop-in clickable header
- `lib/utils/build-order-by.ts` — `buildOrderBy(params, allowedKeys, defaultOrderBy)` — server-safe
- `lib/hooks/useSort.tsx` — existing `useSort<T>()` + `<SortableTh>` (client-side)
- `components/shared/DataTable.tsx` — existing generic column-driven table (zero callers)
- Pattern doc: `docs/guides/sortable-tables.md`

### Reference Example (Enrollments)
- `app/staff/enrollments/page.tsx` — added `sort`/`order` to searchParams, `ALLOWED_SORT_KEYS`, `buildOrderBy`
- `app/staff/enrollments/_components/EnrollmentsTable.tsx` — replaced 5 `<TableHead>` with `<SortableTh>`

### Anti-Cheat Client SDK
- `hooks/useAntiCheat.ts` — fullscreen, tab-switch, clipboard, keyboard shortcuts, DevTools, multi-tab, unload logging
- `components/exam/SecureExamClient.tsx` — exam delivery UI with ARIA live regions

### SEB Integration
- `lib/internal-exam/seb-config.ts` — SEB configuration module (BEK pair generation, ZIP config)
- `lib/middleware/seb-detection.ts` — SEB detection middleware
- `app/api/staff/exams/internal/sessions/[id]/seb-config/route.ts` — SEB config endpoint

### Server-Authoritative Exam Engine
- `lib/internal-exam/engine.ts` — `buildRandomizedPaper()` — shuffles question order AND options
- `scripts/create-grading-function.sql` — `SECURITY DEFINER` PostgreSQL function with `search_path` hardening
- `app/api/cron/recover-exams/route.ts` — auto-submits expired sessions (every 1 min)

---

## 11. HOW TO USE THIS DOCUMENT

1. **To rebuild a lost file:** Find it in Section 8 (NOT RECOVERED). Check if a similar file exists in Section 7 (RECOVERED) as a starting point. The recovered API routes define the contracts the UI components consume.

2. **To re-implement a plan:** Start with the relevant plan in Section 3. The `internal-exam-system-ui-plan.md` is the master plan with 23 sections covering everything.

3. **To re-run audits:** Use the audit documents in Section 2 as baselines. The findings are still valid — re-run against current code to see what's been fixed.

4. **To recover from kilo.db:** The 952 recovered files are at `C:\Users\Pekay\AppData\Local\Temp\kilo\recovered-files\`. Mirror them into the project with `robocopy /E`.

5. **To merge recovery branches:** Use `git checkout recovery/claude-checkpoint-2` to browse the 617 modified files, then `git checkout recovery/claude-checkpoint-2 -- <path>` to apply selectively.

---

## 12. SOURCES OF TRUTH (On Disk, Never Lost)

These files were committed or survived the catastrophic revert:

- `docs/plans/internal-exam-system-ui-plan.md` (2177 lines, 23 sections)
- `docs/plans/anticheat-exam-system-plan.md`
- `docs/plans/anticheat-vs-internal-exam-comparison.md`
- `docs/plans/ACCESSIBILITY.md`
- `ACCESSIBILITY.md` (root)
- `.kilo/plans/1787842321707-portal-audit-orchestration.md`
- `.kilo/plans/1788099263147-anticheat-exam-system-plan.md`
- `CLAUDE.md` (project conventions)
- `docs/audits/portal-audits/staff/*.md` (all 7 staff audit files)
- `docs/guides/sortable-tables.md`
- `docs/guides/analytics-features.md`
- `docs/guides/easa-exam-compliance.md`
- `prisma/schema.prisma` (all schema changes pushed)
- `lib/constants/business-rules.ts` (centralized constants)
- `lib/auth/permission-registry.ts` (RBAC registry)
- `lib/prisma/client.ts` (dual-client pattern)
- All `app/api/` routes that were committed before the catastrophic session
- All `app/staff/`, `app/student/`, `app/instructor/`, `app/examiner/`, `app/applicant/` pages that were committed before the catastrophic session
