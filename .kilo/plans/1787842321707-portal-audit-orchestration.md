# Portal Audit Orchestration Plan

## Overview

Systematic multi-agent audit of all 6 Aerojet Academy portals (Staff, Student, Instructor, Applicant, Examiner, Public), starting with Staff. Each portal is audited by dedicated agents using relevant skills, produces an MD doc for your review, and only after your confirmation are changes made. A 3-pass LLM Council verification runs before integration.

## Scope

**Portals (6 total):**
1. Staff (`app/staff/`) — 34+ pages, admin dashboard
2. Student (`app/student/`)
3. Instructor (`app/instructor/`)
4. Applicant (`app/applicant/`)
5. Examiner (`app/examiner/`)
6. Public (`app/(public)/`)

**Audit dimensions per portal:**
- TypeScript correctness & type safety
- React/Next.js best practices (App Router, server/client boundaries)
- Performance (query parallelization, caching, loading states)
- Security (auth guards, RLS usage, input validation)
- UI/UX (design system compliance, responsive, accessibility)
- Code quality (dead code, duplication, error boundaries)
- EASA 147/145 compliance features

## Agent & Skill Mapping

### Core Audit Agents (run per portal)

| Agent | Skills Used | Audit Focus |
|---|---|---|
| **TypeScript Auditor** | `typescript-best-practices`, `check-compiler-errors` | Type safety, `any` usage, strict mode compliance, type imports |
| **React/Next.js Auditor** | `typescript-best-practices` | Server/client boundaries, `'use client'` placement, App Router patterns, Suspense/loading |
| **Performance Auditor** | `typescript-best-practices` | Query parallelization (`Promise.all`), `prismaUnfiltered` usage, `unstable_cache`, `next/dynamic` |
| **Security Auditor** | `typescript-best-practices` | Auth guards (`requireAdmin` etc.), input validation, SQL injection, XSS, env var handling |
| **UI/UX Auditor** | `baseline-ui`, `source-command-web-design-guidelines` | Design system compliance, responsive patterns, animations, loading states, accessibility |
| **Code Quality Auditor** | `thermo-nuclear-code-quality-review`, `deslop` | Dead code, duplication, giant files, abstraction quality |
| **EASA Compliance Auditor** | Domain knowledge from CLAUDE.md | Part-147/145 features, attendance tracking, OJT logging, exam compliance |

### Verification Agents (post-confirmation)

| Agent | Skills Used | Role |
|---|---|---|
| **LLM Council** | `llm-council` | 3-pass verification: (1) independent review, (2) peer cross-examination, (3) synthesis |
| **TypeScript Re-checker** | `typescript-best-practices`, `check-compiler-errors` | Final type-check pass |
| **Test Runner** | Built-in test commands | Vitest + Playwright verification |

## Phase Structure

### Phase 0: Setup

1. Create audit docs directory: `docs/audits/portal-audits/`
2. Create worktree for Staff portal audit: `worktrees/audit-staff/`
3. Ensure `bun run docs:html` works for doc generation

### Phase 1: Staff Portal Audit (Pilot)

**Step 1.1 — Spawn parallel audit agents**

Spawn 7 Task agents in parallel, each auditing the Staff portal from their specialty angle:

```
Task agents (parallel):
1. typescript-auditor-staff  → docs/audits/portal-audits/staff-typescript.md
2. react-next-auditor-staff  → docs/audits/portal-audits/staff-react-next.md
3. performance-auditor-staff → docs/audits/portal-audits/staff-performance.md
4. security-auditor-staff    → docs/audits/portal-audits/staff-security.md
5. ui-ux-auditor-staff       → docs/audits/portal-audits/staff-ui-ux.md
6. code-quality-auditor-staff → docs/audits/portal-audits/staff-code-quality.md
7. easa-auditor-staff        → docs/audits/portal-audits/staff-easa.md
```

Each agent receives:
- Full path to staff portal: `app/staff/`
- Key files to inspect: layout, all page.tsx files, loading.tsx files, `_components/`
- Audit checklist derived from CLAUDE.md conventions
- Output format: structured MD with findings categorized as **Bug**, **Improvement**, **Suggestion**, or **No Action Needed**
- Each finding must include: file path, line reference, severity, recommendation

**Step 1.2 — Synthesize findings**

Merge all 7 audit docs into a single consolidated document:
- `docs/audits/portal-audits/staff-portal-audit-2026-08-27.md`
- Deduplicate overlapping findings
- Prioritize by severity (Critical → High → Medium → Low)
- Add executive summary

**Step 1.3 — Generate HTML for review**

Run `bun run docs:html` to regenerate the styled HTML mirror so you can review the audit doc in the browser.

**Step 1.4 — Your review**

Present the consolidated audit doc. For each finding, you confirm:
- **Fix** — implement the change
- **Feature** — add new functionality
- **Suggest** — note for future consideration
- **Skip** — no action

### Phase 2: Implementation (after your confirmation)

Only for confirmed items:

1. Create implementation worktree: `worktrees/impl-staff/`
2. Implement fixes/features in priority order
3. Run `bun run type-check`, `bun run test --run`, `bun run lint` after each batch
4. Commit to feature branch (not main)

### Phase 3: LLM Council 3-Pass Verification

After implementation complete:

**Pass 1 — Independent Review**
Each council persona reviews the implemented changes independently:
- Performance Guru: load times, rendering, caching
- Accessibility Advocate: WCAG, semantics, ARIA
- Security Auditor: auth, validation, data handling
- UX/UI Designer: user flows, responsive, consistency
- TypeScript Enforcer: types, boundaries, patterns

**Pass 2 — Peer Cross-Examination**
Personas challenge each other's findings. Conflicts resolved.

**Pass 3 — Synthesis**
Chairman produces final verification report:
- `docs/audits/portal-audits/staff-portal-verification-2026-08-27.md`
- Lists: PASS, FAIL, or NEEDS_REVISION per finding
- Only when all confirmed items show PASS → ready for integration

### Phase 4-N: Repeat for Remaining Portals

Same structure for: Student → Instructor → Applicant → Examiner → Public

Each portal audit:
1. Spawn 7 parallel agents
2. Synthesize findings
3. Generate HTML for your review
4. Implement confirmed items
5. LLM Council 3-pass verification
6. Only then integrate to main dev workspace

## Output Directory Structure

```
docs/audits/portal-audits/
├── staff/
│   ├── staff-typescript.md
│   ├── staff-react-next.md
│   ├── staff-performance.md
│   ├── staff-security.md
│   ├── staff-ui-ux.md
│   ├── staff-code-quality.md
│   ├── staff-easa.md
│   ├── staff-portal-audit-2026-08-27.md    ← consolidated
│   └── staff-portal-verification-2026-08-27.md ← council result
├── student/
├── instructor/
├── applicant/
├── examiner/
└── public/
```

## Audit Checklist (per agent)

### TypeScript Auditor
- [ ] No implicit `any` types
- [ ] Strict null checks respected
- [ ] Proper enum usage (not string literals where enums exist)
- [ ] `Prisma.DbNull` for JSON null filtering
- [ ] Type imports (not value imports from type-only modules)
- [ ] No `unknown` casts without justification
- [ ] Generic types on `serializePrisma<>`

### React/Next.js Auditor
- [ ] Every `page.tsx` with server data has `loading.tsx`
- [ ] `'use client'` only where needed
- [ ] Server components used by default
- [ ] `next/dynamic` for heavy client components (Recharts, TipTap)
- [ ] Proper `searchParams`/`params` handling (async in Next.js 16)
- [ ] No client-side data fetching where server component suffices

### Performance Auditor
- [ ] `prismaUnfiltered` used in staff pages (not `prisma`)
- [ ] Independent queries parallelized with `Promise.all`
- [ ] `unstable_cache` for reference data
- [ ] No loading all rows to filter in JS
- [ ] API responses paginated (`take`/`skip`)
- [ ] Consolidated queries (no multiple `findUnique` for same record)

### Security Auditor
- [ ] Auth guards at all entry points
- [ ] `requireAdmin`/`requireStaff` etc. on protected routes
- [ ] Input validation on all mutations
- [ ] No secrets in client bundles
- [ ] `server-only` imports where needed
- [ ] CSP headers respected
- [ ] Rate limiting on auth endpoints

### UI/UX Auditor
- [ ] Design system patterns followed (stat cards, badges, tables)
- [ ] Responsive at md: breakpoint
- [ ] Loading skeletons present
- [ ] Error states handled
- [ ] Accessible (keyboard nav, ARIA, contrast)
- [ ] Consistent spacing/typography scale
- [ ] `ProtectedImage` for user-uploaded images

### Code Quality Auditor
- [ ] No files > 500 lines
- [ ] No duplicated logic
- [ ] Proper error boundaries
- [ ] Consistent naming conventions
- [ ] No dead code
- [ ] Proper separation of concerns

### EASA Compliance Auditor
- [ ] Attendance tracking for Part-147
- [ ] OJT facility tracking for Part-145
- [ ] Exam compliance reporting
- [ ] Certificate generation workflows
- [ ] Expiration reminders for ratings/licenses

## Workflow Commands

```bash
# Generate docs HTML after each audit doc
bun run docs:html

# Type check
bun run type-check

# Run tests
bun run test --run

# Lint
bun run lint
```

## Decision Gates

1. **After synthesis** → You review consolidated doc, approve findings
2. **After implementation** → LLM Council 3-pass verification
3. **After verification** → All confirmed items PASS → ready for integration
4. **Any gate** → You can halt, redirect, or skip findings

## Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Agent misses findings | Multiple specialized agents overlap coverage; you can request re-audit |
| Scope creep | Strict per-portal boundaries; out-of-scope items go to future backlog |
| Worktree conflicts | One portal at a time; clean branches |
| Verification false positives | 3-pass council with independent personas reduces bias |
| Doc generation overhead | Only run `docs:html` after synthesis, not during |

## Current State

- Project: Aerojet Academy (Next.js 16, Prisma, Neon, Supabase)
- Staff portal: 34+ pages, comprehensive admin dashboard
- Existing audit docs in `docs/audits/` (May 2026 vintage)
- LLM Council framework documented in `docs/LLM_COUNCIL_FRAMEWORK.md`
- No active worktrees yet (agent-manager.json empty)
