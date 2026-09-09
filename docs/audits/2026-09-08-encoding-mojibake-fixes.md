# 2026-09-08 Encoding Mojibake Fixes

## Summary

A comprehensive encoding audit and remediation was performed on 2026-09-08 to eliminate mis-encoded Unicode characters (mojibake) across the codebase. The work was verified through an LLM Council with three independent reviewers: Encoding Specialist, Code Quality Reviewer, and Build/CI Verifier.

## Scope

All source files under the following directories were scanned and fixed:

- `app/`
- `lib/`
- `components/`
- `docs/`
- `tests/`
- `prisma/`

Excluded from scan: `node_modules/`, `.next/`, `.venv/`, `__pycache__/`, `scripts/`

## Files Fixed

### Round 1 — Box-drawing and common patterns (9 files)

| File                                                                 | Patterns Fixed | Count |
| -------------------------------------------------------------------- | -------------- | ----- |
| `app/instructor/exams/_components/InstructorExamsDashboard.tsx`      | `â"€` → `─`    | 489   |
| `app/staff/_components/ReportsPanel.tsx`                             | `â"€` → `─`    | 24    |
| `app/staff/exams/_components/RecordsTab.tsx`                         | `â"€` → `─`    | 12    |
| `app/staff/exams/internal/preview/_components/ExamPreviewClient.tsx` | `â"€` → `─`    | 6     |
| `app/staff/finance/refunds/_components/RefundsManager.tsx`           | `â"€` → `─`    | 31    |
| `app/staff/settings/_components/EmailRegistryTab.tsx`                | `â"€` → `─`    | 77    |
| `app/student/exams/internal/_components/InternalExamInterface.tsx`   | `â"€` → `─`    | 12    |
| `components/layouts/DashboardSidebar.tsx`                            | `â"€` → `─`    | 41    |
| `components/Tour/AppTour.tsx`                                        | `â"€` → `─`    | 403   |

### Round 2 — Additional source files (8 files)

| File                                                      | Patterns Fixed                        | Count |
| --------------------------------------------------------- | ------------------------------------- | ----- |
| `app/applicant/exam-only/page.tsx`                        | `â‚¬` → `€`, `â‚µ` → `₵`              | 15    |
| `app/staff/exams/internal/_components/ExamOperations.tsx` | `â†'` → `→`                           | 1     |
| `app/staff/settings/_components/EmailDeliveryTab.tsx`     | `â†'` → `→`, `â†'` → `←`              | 2     |
| `app/staff/_components/RevenueChart.tsx`                  | `â‚¬` → `€`                           | 1     |
| `components/charts/RevenueChart.tsx`                      | `â‚¬` → `€`                           | 2     |
| `components/CurrencyToggle.tsx`                           | `â‚¬` → `€`, `â‚µ` → `₵`, `â†'` → `→` | 3     |
| `components/exam-only/MyPoolsDashboard.tsx`               | `âœ…` → `✅`, `â‚¬` → `€`             | 3     |
| `components/public/SearchModal.tsx`                       | `âœˆï¸` → `✈`, `â†µ` → `↕`            | 2     |

### Round 3 — Ã/Â-prefixed patterns and HTML (2 files)

| File                                                       | Patterns Fixed                                                                                        | Count |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ----- |
| `app/staff/exams/internal/_components/ExamBankManager.tsx` | `Ã—` → `×`                                                                                            | 3     |
| `docs/html/design-system.html`                             | `Ã—` → `×`, `Â·` → `·`, `â€"` → `–`, `â€"` → `—`, `âœ…` → `✅`, `â‰¥` → `≥`, `â†'` → `←`, `â€¦` → `…` | 40    |

### Round 4 — Emoji mojibake (3 files)

| File                                               | Patterns Fixed                              | Count |
| -------------------------------------------------- | ------------------------------------------- | ----- |
| `app/staff/dashboard/_components/AlertsCenter.tsx` | `ðŸŽ‰` → `🎉`                               | 1     |
| `components/exam-only/MyPoolsDashboard.tsx`        | `ðŸ“‹` → `📋`, `ðŸ“…` → `📅`, `ðŸ’°` → `💰` | 3     |
| `components/public/SearchModal.tsx`                | `ðŸŽ¯` → `🎯`, `ðŸ“¦` → `📦`, `ðŸ“‹` → `📋` | 3     |

## Total Impact

- **20 files** fixed
- **1,095** box-drawing replacements (`â"€` → `─`)
- **26** currency/arrow/emoji replacements in Round 2
- **43** `Ã`/`Â`-prefixed replacements in Round 3
- **7** emoji replacements in Round 4
- **1,171** total replacements

## Root Cause

Mojibake occurred when UTF-8 byte sequences for special characters were misinterpreted as Windows-1252/Latin-1 and then re-encoded as UTF-8. Common patterns:

| Original       | UTF-8 Bytes   | Misread As    | Mojibake |
| -------------- | ------------- | ------------- | -------- |
| `─` (U+2500)   | `E2 94 80`    | Windows-1252  | `â"€`    |
| `€` (U+20AC)   | `E2 82 AC`    | Windows-1252  | `â‚¬`    |
| `×` (U+00D7)   | `C3 97`       | Windows-1252  | `Ã—`     |
| `·` (U+00B7)   | `C2 B7`       | Windows-1252  | `Â·`     |
| `🎉` (U+1F389) | `F0 9F 8E 89` | UTF-8→Latin-1 | `ðŸŽ‰`   |

## Prevention Measures Implemented

### 1. Pre-commit Hook

Added encoding check to `.husky/pre-commit`:

```bash
bun run scripts/check-encoding.mjs
npx lint-staged
```

This runs before every commit and fails if any source file contains mojibake prefixes (`â`, `Ã`, `Â`, `ð`).

### 2. CI Check

Added encoding check to `.github/workflows/ci.yml`:

```yaml
- name: Check encoding
  run: bun run scripts/check-encoding.mjs
```

This runs on every push and PR, failing the build if mojibake is detected.

### 3. Fix Scripts

The following scripts are maintained in the repo for future remediation:

- `scripts/check-encoding.mjs` — detection scanner
- `scripts/fix-encoding-all.mjs` — box-drawing/currency/arrow fixes
- `scripts/fix-encoding-remaining.mjs` — arrow fixes
- `scripts/fix-encoding-final.mjs` — `Ã`/`Â`-prefixed patterns
- `scripts/fix-encoding-emoji.mjs` — emoji corruption fixes

## Recommendations

1. **Use Unicode escapes in generated code**: Agents and scripts should emit `\u2014` for `—`, `\u2500` for `─`, `\u2192` for `→`, etc., instead of raw characters.
2. **Avoid copy-pasting from PDFs/Word**: These are common sources of Windows-1252 characters.
3. **Ensure UTF-8 editor settings**: Verify that editors/terminals use UTF-8 without BOM.
4. **Run encoding check before committing**: `bun run scripts/check-encoding.mjs`
5. **If mojibake is found**: Use the appropriate fix script or run all fix scripts in sequence.

## Verification

- **TypeScript**: 0 errors (`bun run type-check`)
- **Tests**: Pre-existing failures only (unrelated to encoding fixes)
- **Mojibake scan**: 0 instances remaining in source files
