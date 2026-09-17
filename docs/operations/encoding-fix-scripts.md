# Encoding Fix Scripts

## Overview

This document describes the encoding fix scripts used to remediate mojibake in the Aerojet Academy codebase. These scripts are maintained in the repository and should be used for future encoding issues.

## Scripts

### `scripts/check-encoding.mjs`

**Purpose**: Scan source files for mojibake prefixes and fail if any are found.

**Usage**:

```bash
bun run scripts/check-encoding.mjs
```

**Exit codes**:

- `0` — No mojibake detected
- `1` — Mojibake detected; check the output for file paths and instance counts

**What it scans**:

- Directories: `app/`, `lib/`, `components/`, `docs/`, `tests/`, `prisma/`
- Extensions: `.ts`, `.tsx`, `.js`, `.jsx`, `.md`, `.json`, `.mjs`, `.html`
- Excluded: `node_modules/`, `.next/`, `.venv/`, `__pycache__/`, `scripts/`

**Patterns detected**: `â`, `Ã`, `Â`, `ð` (common mojibake prefixes)

---

### `scripts/fix-encoding-all.mjs`

**Purpose**: Fix the 9 originally reported files with box-drawing and common patterns.

**Usage**:

```bash
bun run scripts/fix-encoding-all.mjs
```

**Files fixed**:

1. `app/instructor/exams/_components/InstructorExamsDashboard.tsx`
2. `app/staff/_components/ReportsPanel.tsx`
3. `app/staff/exams/_components/RecordsTab.tsx`
4. `app/staff/exams/internal/preview/_components/ExamPreviewClient.tsx`
5. `app/staff/finance/refunds/_components/RefundsManager.tsx`
6. `app/staff/settings/_components/EmailRegistryTab.tsx`
7. `app/student/exams/internal/_components/InternalExamInterface.tsx`
8. `components/layouts/DashboardSidebar.tsx`
9. `components/Tour/AppTour.tsx`

**Replacements**:

- `â"€` → `─` (box-drawing light horizontal)

---

### `scripts/fix-encoding-remaining.mjs`

**Purpose**: Fix arrow patterns in 4 specific files.

**Usage**:

```bash
bun run scripts/fix-encoding-remaining.mjs
```

**Files fixed**:

1. `app/staff/exams/internal/_components/ExamOperations.tsx`
2. `app/staff/settings/_components/EmailDeliveryTab.tsx`
3. `components/CurrencyToggle.tsx`
4. `components/public/SearchModal.tsx`

**Replacements**:

- `â†'` → `→` (right arrow)
- `â†'` → `↑` (up arrow)
- `â†"` → `↓` (down arrow)
- `â†µ` → `↕` (up down arrow)

---

### `scripts/fix-encoding-final.mjs`

**Purpose**: Fix `Ã`/`Â`-prefixed patterns in 2 files.

**Usage**:

```bash
bun run scripts/fix-encoding-final.mjs
```

**Files fixed**:

1. `app/staff/exams/internal/_components/ExamBankManager.tsx`
2. `docs/html/design-system.html`

**Replacements**:

- `Ã—` → `×` (multiplication sign)
- `Â·` → `·` (middle dot)
- `â€"` → `–` (en dash)
- `â€"` → `—` (em dash)
- `âœ…` → `✅` (check mark button)
- `â‰¥` → `≥` (greater-than or equal)
- `â†'` → `←` (left arrow)
- `â€¦` → `…` (horizontal ellipsis)

---

### `scripts/fix-encoding-emoji.mjs`

**Purpose**: Fix emoji corruption in 3 files.

**Usage**:

```bash
bun run scripts/fix-encoding-emoji.mjs
```

**Files fixed**:

1. `app/staff/dashboard/_components/AlertsCenter.tsx`
2. `components/exam-only/MyPoolsDashboard.tsx`
3. `components/public/SearchModal.tsx`

**Replacements**:

- `ðŸŽ‰` → `🎉` (party popper)
- `ðŸ“‹` → `📋` (clipboard)
- `ðŸ“…` → `📅` (calendar)
- `ðŸ’°` → `💰` (money bag)
- `ðŸŽ¯` → `🎯` (direct hit)
- `ðŸ“¦` → `📦` (package)

---

## Running All Fixes

To run all fix scripts in sequence:

```bash
bun run scripts/fix-encoding-all.mjs
bun run scripts/fix-encoding-remaining.mjs
bun run scripts/fix-encoding-final.mjs
bun run scripts/fix-encoding-emoji.mjs
```

## After Running Fixes

1. **Verify**: Run `bun run scripts/check-encoding.mjs` to confirm no mojibake remains.
2. **Type-check**: Run `bun run type-check` to ensure no TypeScript errors.
3. **Test**: Run `bun run test --run --no-file-parallelism --no-color` to ensure no test failures.
4. **Commit**: Commit the fixed files with a descriptive message.

## Adding New Patterns

If new mojibake patterns are discovered:

1. Identify the exact byte sequence in the corrupted file.
2. Determine the intended Unicode character.
3. Add the replacement to the appropriate fix script.
4. Update `scripts/check-encoding.mjs` if a new prefix is introduced.
5. Document the pattern in `docs/operations/encoding-prevention.md`.

## Notes

- Fix scripts use exact literal-string matching with `split().join()` to avoid regex metacharacter issues.
- Patterns are ordered by specificity to avoid partial matches.
- The scripts intentionally contain `â`, `Ã`, `Â`, and `ð` characters as search patterns — these are not corruption.
