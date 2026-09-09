# Per-Phase Audit Gate Process

> **Status:** Active  
> **Applies to:** Internal exam system build and all future multi-phase implementations  
> **Owner:** Tech lead + assigned security reviewer per phase

---

## 1. Purpose

Phase 5 must not be the only audit gate. Each phase end requires a lightweight but mandatory audit checkpoint before the next phase begins. This catches schema/auth issues early, reduces integration risk, and ensures the final LLM Council review is a confirmation rather than a discovery phase.

---

## 2. Gate Checklist (Every Phase)

Before merging or deploying the completion of Phase N, the following must be satisfied:

### 2.1 Code Review

- [ ] All route handlers use `prismaUnfiltered` (not RLS `prisma`)
- [ ] All new pages have `loading.tsx` and `error.tsx`
- [ ] All list endpoints paginate with `take`/`skip` + `apiPaginated`
- [ ] All privileged mutations write `createAuditLog` with `description` + `changes`
- [ ] No hardcoded business rules outside `lib/constants/business-rules.ts`

### 2.2 Permission Verification

- [ ] Every new route calls the correct `require*` helper (`requireStaff`, `requireInstructor`, `requirePermission`, etc.)
- [ ] New `Permission` keys are seeded in `lib/auth/permission-registry.ts`
- [ ] RBAC helper functions (`requireBankAccess`, etc.) have unit tests
- [ ] No role-array gating remains where `requirePermission` is the standard

### 2.3 Security Spot-Check

- [ ] Rate limiting applied to all bulk-create endpoints
- [ ] Realtime subscriptions use camelCase column filters (`classId=eq.xxx`, not `class_id`)
- [ ] Realtime RLS policies are enabled on new tables
- [ ] CSP `connect-src` includes new WebSocket origins
- [ ] No secrets in client bundles (`server-only` guards present)

### 2.4 Data Integrity

- [ ] Database constraints (unique, foreign key, check) match schema plan
- [ ] `onDelete` behavior is explicit on all new relations
- [ ] Indexes exist on all filtered columns (`@@index` in Prisma)
- [ ] Migrations run: `bun run db:push` + `bun run db:push:supabase`
- [ ] EASA question CSVs in `scripts/easa-seed/csvs_answered/` have **0 unanswered** rows (`correctAnswer` non-empty, no `NEEDS_ANSWER`)
- [ ] All question banks have exactly **3 options** per question (validated by `audit_all_unanswered.py`)
- [ ] No garbage/non-aviation questions remain in any module CSV

### 2.5 Tests

- [ ] Unit tests cover new helpers and business logic
- [ ] Integration tests cover new route handlers
- [ ] Existing test suite passes (`bun run test --run --no-file-parallelism --no-color`)
- [ ] Type-check passes (`bun run type-check`)

### 2.6 Documentation

- [ ] Plan section updated with implementation status
- [ ] New/changed API routes documented in `docs/api/` or route-level comments
- [ ] Any open decisions are recorded in §9 of the plan
- [ ] EASA question CSV audit report attached (output of `audit_all_unanswered.py`)

---

## 2A. EASA Question CSV Audit Gate

Before merging any change that touches `scripts/easa-seed/csvs_answered/` or `prisma/seed-easa-questions.ts`:

1. Run `audit_all_unanswered.py` and verify **0 unanswered** across all modules
2. Run `audit_all_unanswered.py --strict` to verify **all rows have ≥3 valid options**
3. Spot-check 5 random rows per module for aviation relevance and EASA compliance
4. Verify no diagram-dependent questions remain in text-only exam modules
5. Attach the audit output to the gate document

**Known deferred issues (documented in seeding plan §0A):**

- 14 M1 rows with <3 valid options
- M1 degree symbol corruption
- M6 markdown bold markers
- M13 Unicode smart quotes
- Blank `syllabusRef`/`knowledgeLevel` fields
- M1 `correctAnswer` letter-code inconsistency

## 3. Gate Execution

### 3.1 Who Executes

- **Phase 1–2:** Assigned backend/frontend engineer + tech lead review
- **Phase 3–4:** Security reviewer (rotating) + tech lead
- **Phase 5:** Full LLM Council + external compliance sign-off

### 3.2 Artifacts

Each gate produces:

1. **Gate checklist** — completed checklist (this document, checked items)
2. **Diff review** — `git diff` from phase start to phase end
3. **Test report** — output of `bun run test --run --no-file-parallelism --no-color`
4. **Type-check report** — output of `bun run type-check`
5. **Security notes** — any new risks, deferred items, or required follow-ups

Store artifacts in `docs/audits/phase-gates/phase-N-<feature>-<date>.md`.

### 3.3 Approval

- Phase 1–2: Tech lead approval (1 reviewer)
- Phase 3–4: Tech lead + security reviewer approval (2 reviewers)
- Phase 5: LLM Council sign-off + compliance officer sign-off

---

## 4. Exception Process

If a phase cannot satisfy all checklist items:

1. **Record the exception** in the gate document with rationale
2. **Classify severity:**
   - **Blocker:** Must fix before phase advance (e.g., missing auth guard, data loss risk)
   - **Warning:** Can proceed with tracking ticket (e.g., missing loading.tsx, non-critical test)
   - **Info:** Document for future sprint (e.g., optimization, nice-to-have)
3. **Create follow-up ticket** for any non-blocker items
4. **Revisit at next phase gate** — warnings must be resolved before Phase 5

---

## 5. LLM Council Schedule

| Phase | LLM Council Required? | Focus                                              |
| ----- | --------------------- | -------------------------------------------------- |
| 0     | No                    | Compliance docs only                               |
| 1     | No                    | Standard gate checklist                            |
| 2     | No                    | Standard gate checklist                            |
| 3     | No                    | Standard gate checklist + Realtime security review |
| 4     | No                    | Standard gate checklist + grading/audit review     |
| 5     | **Yes**               | Full 3-pass LLM Council against all MUST-FIX items |

The Phase 5 LLM Council is the final verification. All prior gates ensure the council can focus on holistic compliance rather than discovering basic issues.

---

## 6. Quick Reference

| Command                                               | Purpose                       |
| ----------------------------------------------------- | ----------------------------- |
| `bun run type-check`                                  | TypeScript validation         |
| `bun run test --run --no-file-parallelism --no-color` | Vitest suite                  |
| `bun run db:push`                                     | Push schema to Neon           |
| `bun run db:push:supabase`                            | Mirror schema to Supabase     |
| `bun run lint`                                        | ESLint (manual, not in hooks) |

---

## 7. Example Gate Document

```markdown
# Phase 2 Gate — Instructor Experience (2026-09-07)

## Checklist

- [x] Code Review: All routes use prismaUnfiltered
- [x] Permission Verification: requireBankAccess + requireInstructor on all routes
- [x] Security Spot-Check: Rate limiting on class-start, Realtime RLS enabled
- [x] Data Integrity: db:push + db:push:supabase completed
- [x] Tests: 12 new tests passing
- [x] Documentation: Plan §23 updated

## Diff Summary

- Added: 14 files, 2,400 lines
- Modified: 6 files
- Deleted: 0 files

## Test Report

- Passed: 14/14
- Failed: 0
- Duration: 3.2s

## Type-Check Report

- Errors: 0

## Security Notes

- Realtime eventsPerSecond raised to 50 (was 5)
- CSP connect-src updated for Supabase WebSocket
- No new risks identified

## Approval

- Tech Lead: [Name] — Approved 2026-09-07
```
