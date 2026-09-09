# Encoding Prevention Guide

## Overview

This guide documents how to prevent mojibake (mis-encoded Unicode characters) from entering the Aerojet Academy codebase, and how to remediate it if it does appear.

## What is Mojibake?

Mojibake occurs when UTF-8 byte sequences are misinterpreted as another encoding (typically Windows-1252/Latin-1) and then re-encoded as UTF-8. The result is garbled text that looks like `â"€`, `Ã—`, `Â·`, or `ðŸŽ‰` instead of the intended characters.

## Common Patterns in This Codebase

| Mojibake      | Intended Character                | Unicode Code Point |
| ------------- | --------------------------------- | ------------------ |
| `â"€`         | `─` Box Drawings Light Horizontal | U+2500             |
| `â‚¬`         | `€` Euro Sign                     | U+20AC             |
| `â€"`         | `–` En Dash                       | U+2013             |
| `â€"`         | `—` Em Dash                       | U+2014             |
| `â€¦`         | `…` Horizontal Ellipsis           | U+2026             |
| `â€œ` / `â€`  | `"` / `"` Quotation Marks         | U+201C / U+201D    |
| `â€™` / `â€˜` | `'` / `'` Single Quotation Marks  | U+2019 / U+2018    |
| `â€¢`         | `•` Bullet                        | U+2022             |
| `Â·`          | `·` Middle Dot                    | U+00B7             |
| `Ã—`          | `×` Multiplication Sign           | U+00D7             |
| `â†'`         | `→` Right Arrow                   | U+2192             |
| `â†'`         | `↑` Up Arrow                      | U+2191             |
| `â†"`         | `↓` Down Arrow                    | U+2193             |
| `â†µ`         | `↕` Up Down Arrow                 | U+2195             |
| `â†'`         | `←` Left Arrow                    | U+2190             |
| `âœ…`         | `✅` Check Mark Button            | U+2705             |
| `âœˆï¸`       | `✈` Airplane                      | U+2708             |
| `â‰¥`         | `≥` Greater-Than or Equal         | U+2265             |
| `ðŸŽ‰`        | `🎉` Party Popper                 | U+1F389            |
| `ðŸ“‹`        | `📋` Clipboard                    | U+1F4CB            |
| `ðŸ“…`        | `📅` Calendar                     | U+1F4C5            |
| `ðŸ’°`        | `💰` Money Bag                    | U+1F4B0            |
| `ðŸŽ¯`        | `🎯` Direct Hit                   | U+1F3AF            |
| `ðŸ“¦`        | `📦` Package                      | U+1F4E6            |

## Prevention Rules

### For Agents Writing Code

1. **Use Unicode escapes for special characters**: When generating code that requires special characters, use Unicode escape sequences instead of raw characters:
   - `\u2014` instead of `—`
   - `\u2500` instead of `─`
   - `\u2192` instead of `→`
   - `\u20AC` instead of `€`

2. **Avoid raw emoji in generated code**: Emoji are particularly prone to mojibake because they use 4-byte UTF-8 sequences. Prefer:
   - Unicode escapes: `\uD83D\uDE00` for 😀
   - Or better: use `lucide-react` icons instead of emoji

3. **Test regex patterns against actual file bytes**: When writing fix scripts, verify that regex patterns match the actual byte sequences in files before running bulk replacements.

4. **Never paste raw UTF-8 from training data**: Training data may contain characters that get re-encoded incorrectly. Always use escapes or well-known ASCII alternatives.

### For Human Developers

1. **Ensure UTF-8 editor settings**: Configure your editor to use UTF-8 without BOM.
2. **Disable smart quotes/auto-dash**: Features that automatically convert `"` to `"` or `--` to `—` can introduce Windows-1252 characters.
3. **Avoid copy-pasting from PDFs/Word**: These formats often use Windows-1252 encoding. Paste into a plain text editor first to strip formatting.
4. **Use the encoding check before committing**: Run `bun run scripts/check-encoding.mjs` to verify no mojibake exists.

## Detection

### Automated Checks

The project has two automated checks that run automatically:

1. **Pre-commit hook** (`.husky/pre-commit`): Runs `scripts/check-encoding.mjs` before every commit. Fails if mojibake is detected.

2. **CI check** (`.github/workflows/ci.yml`): Runs `scripts/check-encoding.mjs` on every push and PR.

### Manual Scan

To manually scan for mojibake:

```bash
bun run scripts/check-encoding.mjs
```

Or use the underlying scanner directly:

```bash
node -e "
const fs = require('fs');
const dirs = ['app', 'lib', 'components', 'docs', 'tests', 'prisma'];
const skip = new Set(['node_modules', '.next', '.venv', '__pycache__', 'scripts']);
const badPrefixes = ['â', 'Ã', 'Â', 'ð'];

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = dir + '/' + e.name;
    if (skip.has(e.name)) continue;
    if (e.isDirectory()) walk(p);
    else if (/\.(ts|tsx|js|jsx|md|json|mjs|html)$/.test(e.name)) {
      const b = fs.readFileSync(p, 'utf8');
      for (let i = 0; i < b.length; i++) {
        if (badPrefixes.includes(b[i])) {
          console.log(p + ':' + i + ' ' + JSON.stringify(b.slice(i, i + 4)));
        }
      }
    }
  }
}

for (const d of dirs) walk(d);
"
```

## Remediation

If mojibake is detected, use the appropriate fix script:

### Quick Fix

Run all fix scripts in sequence:

```bash
bun run scripts/fix-encoding-all.mjs
bun run scripts/fix-encoding-remaining.mjs
bun run scripts/fix-encoding-final.mjs
bun run scripts/fix-encoding-emoji.mjs
```

### Individual Fixes

If you know the specific pattern, run the corresponding script:

```bash
# Box-drawing and common patterns
bun run scripts/fix-encoding-all.mjs

# Arrow patterns
bun run scripts/fix-encoding-remaining.mjs

# Ã/Â-prefixed patterns
bun run scripts/fix-encoding-final.mjs

# Emoji corruption
bun run scripts/fix-encoding-emoji.mjs
```

### After Fixing

1. Verify the fix: `bun run scripts/check-encoding.mjs`
2. Run type-check: `bun run type-check`
3. Run tests: `bun run test --run --no-file-parallelism --no-color`
4. Commit the changes

## Fix Scripts Reference

### `scripts/check-encoding.mjs`

Scans source files for mojibake prefixes (`â`, `Ã`, `Â`, `ð`). Exits with code 1 if any are found.

### `scripts/fix-encoding-all.mjs`

Fixes 9 originally reported files with box-drawing and common patterns:

- `â"€` → `─`
- `â‚¬` → `€`
- `Â·` → `·`

### `scripts/fix-encoding-remaining.mjs`

Fixes arrow patterns in 4 specific files:

- `â†'` → `→`
- `â†'` → `↑`
- `â†"` → `↓`
- `â†µ` → `↕`

### `scripts/fix-encoding-final.mjs`

Fixes `Ã`/`Â`-prefixed patterns in 2 files:

- `Ã—` → `×`
- `Â·` → `·`
- `â€"` → `–`
- `â€"` → `—`
- `âœ…` → `✅`
- `â‰¥` → `≥`
- `â†'` → `←`
- `â€¦` → `…`

### `scripts/fix-encoding-emoji.mjs`

Fixes emoji corruption in 3 files:

- `ðŸŽ‰` → `🎉`
- `ðŸ“‹` → `📋`
- `ðŸ“…` → `📅`
- `ðŸ’°` → `💰`
- `ðŸŽ¯` → `🎯`
- `ðŸ“¦` → `📦`

## Best Practices

1. **Prefer ASCII or Unicode escapes** in source code for special characters
2. **Use icon libraries** (`lucide-react`) instead of emoji in UI components
3. **Run encoding check** before committing
4. **Configure editor** to use UTF-8 without BOM
5. **Avoid copy-pasting** from formatted documents (PDF, Word)
6. **Review diffs** carefully for unexpected character changes
