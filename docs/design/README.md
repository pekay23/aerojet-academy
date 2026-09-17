# Aerojet Academy · Design System

> Source of truth for color tokens, fonts, sizes, spacing, and the visual
> language that holds the public site, the staff portal, and the design lab
> together. Mirrored as `docs/html/design-system.html` for browser-friendly
> browsing.

This document is the **canonical reference** — every value below is
extracted directly from the running app, not paraphrased.

| Source of truth         | File                              |
| ----------------------- | --------------------------------- |
| Color & font CSS vars   | `app/globals.css`                 |
| Tailwind config         | `tailwind.config.ts`              |
| shadcn/ui base          | `components.json` (`baseColor: slate`) |
| shadcn/ui tokens        | `components/ui/*`                 |
| Public nav colors       | `components/layouts/PublicNav.tsx` |
| Font loading            | `app/layout.tsx` (Inter / Outfit / Playfair) |
| Dark mode toggle        | `next-themes` (`app/providers.tsx`) |
| Theme defaults (DB)     | `ThemeConfig` Prisma model        |
| Brand examples          | `app/(public)/_components/*.tsx`  |
| Home variants           | `app/design-lab/variants/*.tsx`   |

---

## 1 · Brand foundations

### 1.1 Voice & visual language

- **Editorial / aviation-meets-luxury.** Headings in a serif (Playfair) for
  the public site; a geometric sans (Outfit) for the design-lab and a more
  neutral sans (Inter) for body and portal UI.
- **Three canonical "looks" coexist in the repo** — visible in
  `app/design-lab/variants/`:
  - **Variant A / B** — dark, technical, sci-fi cockpit (navy + sky blue).
  - **Variant C** — editorial / newsprint (paper background, blue ink).
  - **Variant D / E** — modern flat marketing (white, big type, accent pills).
- The **public site** is currently a Variant-C-style editorial layout
  (paper background, `text-aerojet-blue`, Playfair headings, `bg-paper`).
- The **staff/student portals** use a sidebar-based shadcn/ui layout on a
  near-white / near-black surface.

### 1.2 Color hex cheat-sheet (for designers)

| Token                    | HSL                              | Hex       | Role                        |
| ------------------------ | -------------------------------- | --------- | --------------------------- |
| `--aero-blue`            | `213 100% 18%`                   | `#002a5c` | Brand primary / headings on paper |
| `--aero-sky`             | `210 82% 45%`                    | `#1f7ad6` | Accent / interactive (light) |
| `--aero-light`           | `204 65% 40%`                    | `#2e7eb3` | Mid-blue hover / link state |
| `--aero-soft-blue`       | `210 100% 40%`                   | `#0066ff` | Focus ring / CTA hover      |
| `--aero-slate`           | `210 29% 24%`                    | `#2c3e50` | Body / heading on light bg  |
| `--aero-offwhite`        | `0 0% 98%`                       | `#f9f9f9` | Off-white surface           |
| `--public-primary`       | `211 100% 18%`                   | `#002347` | Public nav / footer primary |
| `--public-secondary`     | `212 82% 61%`                    | `#4993e4` | Public nav CTA / accents    |
| `--public-dark`          | `216 34% 25%`                    | `#2f3e57` | Footer text / dark surface  |
| `bg-paper`               | —                                | `#f7f3ec` | Editorial page background   |
| `bg-paper-dark`          | —                                | `#efe8dc` | Editorial card surface      |
| `background-light`       | —                                | `#f6f6f8` | Dashboard light surface     |
| `background-dark`        | —                                | `#101622` | Dashboard dark surface      |
| Sidebar bg (light)       | `222 47% 11%`                    | `#0f172a` | Slate-900 dashboard chrome   |

> ⚠️ All brand blues were deliberately **darkened from their HSL
> prototypes** to meet WCAG AA 4.5:1 contrast against white. Comments in
> `app/globals.css` preserve the original light-mode values for reference.

---

## 2 · Color tokens (Tailwind class → CSS var → HSL)

### 2.1 shadcn/ui semantic palette (light → dark)

These come from the `slate` base + a `dark` class on `<html>`, declared in
`app/globals.css` and re-exported as Tailwind utilities via
`tailwind.config.ts`.

| Tailwind class           | CSS var                | Light HSL           | Dark HSL             | Use                                    |
| ------------------------ | ---------------------- | ------------------- | -------------------- | -------------------------------------- |
| `bg-background`          | `--background`         | `0 0% 100%`         | `222.2 84% 4.9%`     | Page bg                                |
| `text-foreground`        | `--foreground`         | `222.2 84% 4.9%`    | `210 40% 98%`        | Default text                           |
| `bg-card` / `text-card-foreground` | `--card`     | `0 0% 100%`         | `222.2 84% 4.9%`     | Card surface                           |
| `bg-popover`             | `--popover`            | `0 0% 100%`         | `222.2 84% 4.9%`     | Popover, dropdown, sheet               |
| `bg-primary`             | `--primary`            | `222.2 47.4% 11.2%` | `210 40% 98%`        | Primary action / brand chrome          |
| `text-primary-foreground`| `--primary-foreground` | `210 40% 98%`       | `222.2 47.4% 11.2%`  | Text on primary                        |
| `bg-secondary`           | `--secondary`          | `210 40% 96.1%`     | `217.2 32.6% 17.5%`  | Secondary surface                      |
| `bg-muted`               | `--muted`              | `210 40% 96.1%`     | `217.2 32.6% 17.5%`  | Muted surface                          |
| `text-muted-foreground`  | `--muted-foreground`   | `215.4 16.3% 35%`   | `215 20.2% 75%`      | Captions, helper text (contrast tuned) |
| `bg-accent`              | `--accent`             | `210 40% 96.1%`     | `217.2 32.6% 17.5%`  | Hover/active accent                    |
| `bg-destructive`         | `--destructive`        | `0 84.2% 60.2%`     | `0 62.8% 30.6%`      | Destructive / error                    |
| `border-border`          | `--border`             | `214.3 31.8% 91.4%` | `217.2 32.6% 17.5%`  | Default 1px border                     |
| `ring-ring`              | `--ring`               | `222.2 84% 4.9%`    | `212.7 26.8% 83.9%`  | Focus ring                             |

### 2.2 Sidebar tokens

| Token                              | Light            | Dark              |
| ---------------------------------- | ---------------- | ----------------- |
| `--sidebar-background`             | `222 47% 11%`    | `222 47% 5%`      |
| `--sidebar-foreground`             | `210 40% 98%`    | `210 40% 98%`     |
| `--sidebar-primary`                | `217 91% 60%`    | `217 91% 60%`     |
| `--sidebar-accent`                 | `217 33% 17%`    | `217 33% 12%`     |
| `--sidebar-border`                 | `217 33% 17%`    | `217 33% 12%`     |
| `--sidebar-ring`                   | `217.2 91.2% 59.8%` | same           |

Reached via `bg-sidebar`, `text-sidebar-foreground`, `border-sidebar-border`,
etc.

### 2.3 Aerojet brand tokens (light)

Declared under `:root` and overridden in `.dark`. Use these on the **public
marketing surface**, not inside portal chrome.

| Token                    | Light HSL         | Hex       | Tailwind class          |
| ------------------------ | ----------------- | --------- | ----------------------- |
| Aerojet blue             | `213 100% 18%`    | `#002a5c` | `text-aerojet-blue` / `bg-aerojet-blue` |
| Aerojet sky              | `210 82% 45%`     | `#1f7ad6` | `text-aerojet-sky` / `bg-aerojet-sky`   |
| Aerojet light            | `204 65% 40%`     | `#2e7eb3` | `text-aerojet-light`                    |
| Aerojet soft-blue        | `210 100% 40%`    | `#0066ff` | `text-aerojet-soft-blue`                |
| Aerojet slate            | `210 29% 24%`     | `#2c3e50` | `text-aerojet-slate`                    |
| Aerojet offwhite         | `0 0% 98%`        | `#f9f9f9` | `bg-aerojet-offwhite`                   |

### 2.4 Public-site tokens

| Token                | Value             | Tailwind class          | Notes                          |
| -------------------- | ----------------- | ----------------------- | ------------------------------ |
| `--public-primary`   | `211 100% 18%`    | `bg-public-primary`     | Footer / dark CTAs             |
| `--public-secondary` | `212 82% 61%`     | `bg-public-secondary`   | Accent CTA in public nav       |
| `--public-dark`      | `216 34% 25%`     | `bg-public-dark`        | Footer surface                 |

### 2.5 Hard-coded page surfaces (not in CSS vars)

| Class          | Hex       | Used in                                    |
| -------------- | --------- | ------------------------------------------ |
| `bg-paper`     | `#f7f3ec` | `(public)` editorial page bg               |
| `bg-paper-dark`| `#efe8dc` | `(public)` editorial hover row             |
| `bg-[#0a1628]` | `#0a1628` | Hero variants A / D                        |
| `bg-[#0b0e13]` | `#0b0e13` | Hero variant B                             |
| `bg-[#f7f3ec]` | `#f7f3ec` | Hero variant C                             |
| `text-[#1b2430]` | `#1b2430` | Editorial body text (Variant C / live)   |
| `text-[#0a1628]` | `#0a1628` | Editorial body text (Variant E)          |

---

## 3 · Typography

### 3.1 Loaded families (`app/layout.tsx`)

All three are loaded via `next/font/google` with `display: 'swap'` and
exposed as CSS variables on `<html>`:

| Family                | CSS var                | Weights (default) | Used for                                     |
| --------------------- | ---------------------- | ----------------- | -------------------------------------------- |
| **Inter**             | `--font-inter`         | 400–700           | `font-sans` default — body, portal UI        |
| **Outfit**            | `--font-outfit`        | 400–900           | Design-lab variants, marketing headlines      |
| **Playfair Display**  | `--font-playfair`      | 400–700           | Live public-site editorial headings (`font-serif`) |

### 3.2 Tailwind font family aliases (`tailwind.config.ts`)

```
font-sans    → var(--font-inter) → system-ui → sans-serif
font-outfit  → var(--font-outfit) → sans-serif
font-heading → var(--font-cal)   → var(--font-inter) → system-ui → sans-serif
font-serif   → var(--font-playfair) → Georgia → serif
```

> `font-heading` is declared but the `--font-cal` variable is **not loaded
> in `app/layout.tsx` yet** — it falls through to Inter. Consider this a
> stub for a future "Cal Sans" or similar.

### 3.3 Live-site type scale (Variant C / editorial)

Pulled from the actual `(public)/_components/*.tsx` and `(public)/page.tsx`:

| Role                  | Class                                              | Size   | Weight | Tracking           |
| --------------------- | -------------------------------------------------- | ------ | ------ | ------------------ |
| Hero H1               | `font-serif text-4xl ... sm:text-6xl lg:text-7xl`  | 4rem  | `font-medium` (500) | `tracking-tight` (0.04em) |
| Section H2            | `font-serif text-3xl font-medium sm:text-4xl`      | 1.875rem | 500  | default            |
| H3 / Card title       | `font-serif text-2xl font-medium`                  | 1.5rem  | 500  | default            |
| Eyebrow               | `text-[11px] font-bold tracking-[0.3em] uppercase` | 0.6875rem | 700 | `0.3em` wide       |
| Body lead             | `text-lg leading-relaxed text-[#1b2430]/85`        | 1.125rem | 400  | —                  |
| Body                  | `text-base leading-relaxed`                        | 1rem    | 400  | —                  |
| Drop cap              | `first-letter:font-serif first-letter:text-6xl first-letter:font-medium` | 3.75rem | 500 | `leading-[0.8]` |
| Nav CTA              | `text-xs font-black tracking-[0.25em] uppercase`   | 0.75rem | 900   | `0.25em`           |
| Stat number          | `font-serif text-3xl font-medium`                  | 1.875rem | 500  | —                  |
| Stat label           | `text-[10px] font-bold tracking-[0.2em] uppercase` | 0.625rem | 700  | `0.2em`            |

### 3.4 Portal / dashboard type scale (shadcn/ui defaults)

| Role          | Class                  | Notes                          |
| ------------- | ---------------------- | ------------------------------ |
| H1            | `text-4xl font-semibold tracking-tight` | Page header             |
| H2            | `text-3xl font-semibold`               | Section                |
| H3 / CardTitle| `text-2xl font-semibold leading-none tracking-tight` | Card title |
| Body          | `text-sm text-muted-foreground`        | Default body in cards   |
| Small / cap   | `text-xs font-medium`                  | Inline meta             |

### 3.5 shadcn `Button` / `Badge` / `Input`

- `Button` default body: `text-sm font-medium`.
- `Badge`: `text-xs font-semibold`.
- `Input` height: `h-11` (44px — WCAG min touch target).

---

## 4 · Sizing & spacing

### 4.1 Border radius (`tailwind.config.ts`)

| Token    | Value                       | Use                         |
| -------- | --------------------------- | --------------------------- |
| `rounded-sm` | `calc(var(--radius) - 4px)` = 4px | Tight inputs, badges |
| `rounded-md` | `calc(var(--radius) - 2px)` = 6px | Default `Button`, `Card`, `Input` |
| `rounded-lg` | `var(--radius)` = 8px       | Larger cards, sheets         |
| `rounded-xl` | 12px (Tailwind default)     | Marketing CTAs               |
| `rounded-2xl` | 16px                       | Marketing feature tiles      |
| `rounded-3xl` | 24px                       | Hero image frames            |
| `rounded-4xl` | 32px                       | Variant D hero block         |
| `rounded-full` | 9999px                    | Pills, chips, avatar         |

`--radius` is set to `0.5rem` (8px) in `app/globals.css`.

### 4.2 Component sizes (shadcn)

| Component   | Size            | Class             | Touch target    |
| ----------- | --------------- | ----------------- | --------------- |
| `Button`    | `default`       | `h-11 px-4 py-2`  | **44×44** ✅ WCAG |
| `Button`    | `sm`            | `h-9 px-3`        | 36×32            |
| `Button`    | `lg`            | `h-12 px-10`      | 48×≥40           |
| `Button`    | `icon`          | `h-11 w-11`       | 44×44            |
| `Input`     | default         | `h-11`            | 44               |
| `Switch