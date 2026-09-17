# Tailwind CSS v4 Migration Plan

> Status: Planned (not yet executed)
> Project: `aerojet-academy`
> Tailwind version installed: `4.3.3`
> Current config style: v3 (`tailwind.config.ts`)

## Overview

The project currently runs **Tailwind CSS v4.3.3** but the configuration file (`tailwind.config.ts`) is written in **Tailwind v3 syntax**. This is supported via the `@config` back-compat directive in v4, but it is not the recommended approach for v4 and will eventually be deprecated.

The goal of this migration is to move the entire design-token layer from the JS-based `tailwind.config.ts` into native **CSS `@theme` blocks**, making the configuration fully CSS-native and aligned with Tailwind v4's design.

---

## Current State

### What Exists

**`app/globals.css`** (lines 1–2):
```css
@import 'tailwindcss';
@config '../tailwind.config.ts';
```
- Uses v4's `@import 'tailwindcss'` entry point
- Uses v4's `@config` back-compat directive to load v3-style JS config

**`tailwind.config.ts`** — v3 syntax:
```typescript
const config: Config = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: { ... },        // CSS variables referencing hsl(...)
      borderRadius: { ... },
      fontFamily: { ... },
      keyframes: { ... },
      animation: { ... },
    },
  },
  plugins: [tailwindTypography],
}
export default config
```

### Problems with the Current Hybrid Setup

| Issue | Severity | Detail |
|-------|----------|--------|
| `@config` back-compat is deprecated in v4 | Medium | Will eventually stop working; already discouraged in v4 docs |
| JS config reloads on every file change | Performance | v4's native CSS-based config is computed at build time only |
| `darkMode: 'class'` is v3 syntax | Medium | v4 uses `@custom-variant dark (&:where(.dark, .dark *))` |
| `theme.extend` is v3 syntax | Medium | v4 uses `@theme` block in CSS |
| `plugins: [tailwindTypography]` is v3 | Medium | v4 uses `@plugin '@tailwindcss/typography';` in CSS |
| Custom keyframes in JS | Medium | v4 expects `--animate-*` CSS variables |
| Custom colors via `hsl(var(--x))` | Low | Still works but should move to `@theme { --color-x: hsl(...) }` |

---

## Migration Steps

### Step 1 — Update `app/globals.css`

**Remove** the `@config` line. Replace with `@source` for content detection.

**Add** all design tokens as `@theme` blocks.

#### Before (lines 1–2 of globals.css):
```css
@import 'tailwindcss';
@config '../tailwind.config.ts';
```

#### After:
```css
@import 'tailwindcss';
@source '../app/**/*.{ts,tsx}';
@source '../components/**/*.{ts,tsx}';
@source '../lib/**/*.{ts,tsx}';
```

> Note: v4 auto-detects content without explicit `@source` in most cases. Add it only if auto-detection misses pages.

---

### Step 2 — Migrate Design Tokens to CSS `@theme`

Move every value from `tailwind.config.ts`'s `theme.extend` into a `@theme` block in `globals.css`.

#### 2a. Colors

**From `tailwind.config.ts`:**
```typescript
colors: {
  border: 'hsl(var(--border))',
  background: 'hsl(var(--background))',
  primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
  // ... 40+ more color entries
  aerojet: {
    blue: 'hsl(var(--aero-blue))',
    sky: 'hsl(var(--aero-sky))',
    // ...
  },
},
```

**To `globals.css` (replace the `:root` CSS variables):**
```css
@theme {
  /* Semantic colors — no change to the CSS variables themselves */
  --color-border: hsl(var(--border));
  --color-background: hsl(var(--background));
  --color-foreground: hsl(var(--foreground));
  --color-primary: hsl(var(--primary));
  --color-primary-foreground: hsl(var(--primary-foreground));
  /* ... all other semantic colors ... */

  /* Custom aerojet palette */
  --color-aerojet-blue: hsl(var(--aero-blue));
  --color-aerojet-sky: hsl(var(--aero-sky));
  --color-aerojet-light: hsl(var(--aero-light));
  --color-aerojet-soft-blue: hsl(var(--aero-soft-blue));
  --color-aerojet-slate: hsl(var(--aero-slate));
  --color-aerojet-offwhite: hsl(var(--aero-offwhite));

  /* Sidebar colors */
  --color-sidebar: hsl(var(--sidebar-background));
  --color-sidebar-foreground: hsl(var(--sidebar-foreground));
  /* ... all sidebar tokens ... */

  /* Public palette */
  --color-public-primary: hsl(var(--public-primary));
  --color-public-secondary: hsl(var(--public-secondary));
  --color-public-dark: hsl(var(--public-dark));
}
```

**Note:** The existing `:root` CSS variable declarations (`--background`, `--primary`, etc.) **must be kept** because they define the token values. The `@theme` block *references* those variables. You do NOT duplicate the variable values — only map them to Tailwind's token system.

#### 2b. Border Radius

**From `tailwind.config.ts`:**
```typescript
borderRadius: {
  lg: 'var(--radius)',
  md: 'calc(var(--radius) - 2px)',
  sm: 'calc(var(--radius) - 4px)',
},
```

**To `@theme`:**
```css
@theme {
  --radius-lg: var(--radius);
  --radius-md: calc(var(--radius) - 2px);
  --radius-sm: calc(var(--radius) - 4px);
}
```

#### 2c. Font Families

**From `tailwind.config.ts`:**
```typescript
fontFamily: {
  sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
  outfit: ['var(--font-outfit)', 'sans-serif'],
  heading: ['var(--font-cal)', 'var(--font-inter)', 'system-ui', 'sans-serif'],
  serif: ['var(--font-playfair)', 'Georgia', 'serif'],
},
```

**To `@theme`:**
```css
@theme {
  --font-sans: var(--font-inter), system-ui, sans-serif;
  --font-outfit: var(--font-outfit), sans-serif;
  --font-heading: var(--font-cal), var(--font-inter), system-ui, sans-serif;
  --font-serif: var(--font-playfair), Georgia, serif;
}
```

#### 2d. Custom Animations

**From `tailwind.config.ts`:**
```typescript
keyframes: {
  'accordion-down': { from: { height: '0' }, to: { height: 'var(--radix-accordion-content-height)' } },
  'accordion-up': { from: { height: 'var(--radix-accordion-content-height)' }, to: { height: '0' } },
},
animation: {
  'accordion-down': 'accordion-down 0.2s ease-out',
  'accordion-up': 'accordion-up 0.2s ease-out',
},
```

**To `@theme`:**
```css
@theme {
  --animate-accordion-down: accordion-down 0.2s ease-out;
  --animate-accordion-up: accordion-up 0.2s ease-out;
}
```

**To `globals.css` (keyframes must stay as CSS `@keyframes`):**
```css
@keyframes accordion-down {
  from { height: 0; }
  to { height: var(--radix-accordion-content-height); }
}
@keyframes accordion-up {
  from { height: var(--radix-accordion-content-height); }
  to { height: 0; }
}
```

#### 2e. Custom zIndex

**From `tailwind.config.ts`:**
```typescript
zIndex: {
  '60': '60',
  '70': '70',
  '80': '80',
},
```

**To `@theme`:**
```css
@theme {
  --z-60: 60;
  --z-70: 70;
  --z-80: 80;
}
```

---

### Step 3 — Migrate `darkMode` to CSS Variants

**From `tailwind.config.ts`:**
```typescript
darkMode: 'class',
```

**To `globals.css`:**
```css
@custom-variant dark (&:where(.dark, .dark *));
```

This must be placed **before** any `@theme` block, typically at the top of the CSS file after the `@import`.

---

### Step 4 — Add Typography Plugin

**From `tailwind.config.ts`:**
```typescript
plugins: [tailwindTypography],
```

**To `globals.css`:**
```css
@plugin '@tailwindcss/typography';
```

This replaces the `plugins` array in the JS config. The `@plugin` directive must come **after** `@import 'tailwindcss'`.

---

### Step 5 — Delete `tailwind.config.ts`

After all tokens are migrated to CSS, delete `tailwind.config.ts` and remove the `@config` directive from `globals.css`.

```bash
# After migration is verified:
rm tailwind.config.ts
```

---

## Files to Edit / Create

| File | Action |
|------|--------|
| `app/globals.css` | Edit — remove `@config`, add `@source`, add `@theme`, add `@custom-variant dark`, add `@plugin`, move keyframes |
| `tailwind.config.ts` | Delete — after all tokens are migrated |
| `package.json` | No change needed — `tailwindcss@4.3.3` is already installed |

---

## Files That Reference `tailwind.config.ts`

No source files import or reference `tailwind.config.ts` directly. All usage is via the `@config` directive in CSS, which is automatically handled by Tailwind v4.

To confirm no hard references exist:
```bash
grep -r "tailwind.config" --include="*.ts" --include="*.tsx" --include="*.js"
```

---

## Post-Migration Verification

1. **Build check**: `bun run build` — must complete without errors
2. **Visual regression**: Run the dev server and check all portal pages visually
3. **Class name check**: `grep -r "bg-background\|text-foreground" --include="*.tsx" | wc -l` — confirm utility classes still work
4. **Dark mode**: Toggle dark mode and verify sidebar, cards, typography all adapt
5. **Typography plugin**: Check that `.prose` class still styles article content correctly
6. **Custom animations**: Verify accordion open/close transitions still work

---

## Rollback Plan

If the migration causes issues:

1. Restore `globals.css` to its pre-migration state (keep `@config '../tailwind.config.ts'`)
2. Restore `tailwind.config.ts` from git
3. The `@config` back-compat will resume working immediately

---

## Estimated Effort

| Task | Effort |
|------|--------|
| Move colors to `@theme` | ~2 hours |
| Move border-radius, fonts, animations | ~1 hour |
| Replace `darkMode: 'class'` with `@custom-variant` | ~15 min |
| Replace `plugins` with `@plugin` | ~5 min |
| Delete config + verify build | ~30 min |
| Visual QA | ~1 hour |
| **Total** | **~5 hours** |
