# Final Audit — 2026-05-21

Comprehensive sweep performed after the internal-exams hardening work landed in commits `eee14c5` and `907c4a7`. Companion to [2026-05-21-internal-exams.md](./2026-05-21-internal-exams.md).

## Verification

| Check | Result |
|---|---|
| `bun run type-check` | ✓ clean |
| `bun run test --run` | ✓ 116/116 (15 files) |
| `bun run build` | ✓ exit 0 |
| Working tree | clean |

## Status of prior findings (EXAM-1..EXAM-14)

All 14 internal-exams findings from the prior audit are committed and confirmed in place:

- **CRITICAL** EXAM-1 (void schema columns) — `voidedAt`/`voidedBy`/`voidReason` present in [prisma/schema.prisma](../../prisma/schema.prisma); void route writes them without casts. ✅
- **HIGH** EXAM-2 (audit logs on publish/void) — `createAuditLog` calls in [publish/route.ts](../../app/api/staff/exams/internal/operations/publish/route.ts) and [void/route.ts](../../app/api/staff/exams/internal/operations/void/route.ts). ✅
- **HIGH** EXAM-3 (status-leak in progress endpoint) — fixed by setting `entry.status` only at entry creation (newest session first via DESC ordering). ✅
- **HIGH** EXAM-4 (dead retake/ban computation) — removed from [submit/route.ts](../../app/api/student/exams/internal/submit/route.ts). ✅
- **HIGH** EXAM-5 (sessions payload size) — split into list ([sessions/route.ts](../../app/api/staff/exams/internal/operations/sessions/route.ts)) + detail ([sessions/[id]/route.ts](../../app/api/staff/exams/internal/operations/sessions/[id]/route.ts)). ~95% list payload reduction. ✅
- EXAM-6..14 — all addressed (zod validation, visibility-aware polling at 30s, lazy-fetch on row expand, `subTopic` removed from student-facing question shape, 4-option seed, pending-reports alert added to dashboard). ✅

## New findings this pass

### FINAL-1 (LOW) — `as any` casts in internal-exams routes — fixed in this audit

Three minor casts existed after the EXAM fixes landed; they masked nothing dangerous but obscured intent.

- [app/api/staff/exams/internal/banks/route.ts:75,92](../../app/api/staff/exams/internal/banks/route.ts#L75) — `_ctx: any` on POST signature (unused) and `parsed.data.ruleSet as any`. zod enum aligns with Prisma `ExamRuleSet`, cast unnecessary.
- [app/api/staff/exams/internal/banks/[bankId]/questions/route.ts:78](../../app/api/staff/exams/internal/banks/[bankId]/questions/route.ts#L78) — `parsed.data.difficulty as any`. Same — aligns with `QuestionDifficulty`.
- [app/api/student/exams/internal/start/route.ts:19,143](../../app/api/student/exams/internal/start/route.ts#L19) — `_ctx: any` + `(eligibility as any).attemptNumber`. Replaced with `'attemptNumber' in eligibility ? eligibility.attemptNumber : 1` to narrow the discriminated union returned by `checkEligibility`.

Verification: `bun run type-check` clean after fix.

### No issues found

The following sweeps came up clean and are noted for the record:

- **Auth boundaries** — every `/api/staff/exams/internal/*` route calls `requireStaff()` or stricter; every `/api/student/exams/internal/*` route validates `session.user.role === 'STUDENT'`.
- **`as any` / `@ts-ignore` outside internal-exams** — no new occurrences introduced by the two commits.
- **`console.*` in API routes** — 92 files contain at least one, but spot checks show all are intentional `console.error` calls in catch blocks for cron/uploadthing/webhook diagnostics. No `console.log` debug leftovers in the internal-exams area.
- **Schema drift** — `prisma generate` matches schema; `prismaUnfiltered.internalExamSession` types include `voidedAt`/`voidedBy`/`voidReason`/`isPublished`.
- **Audit logs** — every privileged mutation in the internal-exams area now writes through `createAuditLog` with `description:` + `changes:` per project convention.
- **Cron registry** — `vercel.json` declares 16 jobs; all 16 have route files under `app/api/cron/*`. No orphans either direction.

## Files touched in this audit

- `app/api/staff/exams/internal/banks/route.ts` — drop two `any`s
- `app/api/staff/exams/internal/banks/[bankId]/questions/route.ts` — drop `any`
- `app/api/student/exams/internal/start/route.ts` — drop two `any`s, narrow eligibility union
- `docs/audits/2026-05-21-final-audit.md` — this file

No schema changes, no migrations, no behaviour changes. Pure type-safety cleanup.
