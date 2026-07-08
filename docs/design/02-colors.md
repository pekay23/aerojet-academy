# 02 · Color tokens

The Aerojet palette is split into three layers, all defined in
`app/globals.css` and exported as Tailwind utilities through
`tailwind.config.ts`:

1. **shadcn/ui semantic palette** (the portal default) — comes from the
   `slate` base, with a `.dark` class on `<html>` to invert.
2. **Aerojet brand palette** — six `--aero-*` CSS variables used on the
   public marketing surface.
3. **Public-site palette** — three `--public-*` variables used in the
   nav, footer, and CTA buttons.

There are also a handful of **hard-coded hex surfaces** used on the live
homepage and in design-lab variants.

---

## 2.1 · shadcn/ui semantic palette

| Tailwind class                     | CSS var                | Light HSL           | Dark HSL            | Use                                    |
| ---------------------------------- | ---------------------- | ------------------- | ------------------- | -------------------------------------- |
| `bg-background`                    | `--background`         | `0 0% 100%`         | `222.2 84% 4.9%`    | Page bg                                |
| `text-foreground`                  | `--foreground`         | `222.2 84% 4.9%`    | `210 40% 98%`       | Default text                           |
| `bg-card` / `text-card-foreground` | `--card`               | `0 0% 100%`         | `222.2 84% 4.9%`    | Card surface                           |
| `bg-popover`                       | `--popover`            | `0 0% 100%`         | `222.2 84% 4.9%`    | Popover, dropdown, sheet               |
| `bg-primary`                       | `--primary`            | `222.2 47.4% 11.2%` | `210 40% 98%`       | Primary action / brand chrome          |
| `text-primary-foreground`          | `--primary-foreground` | `210 40% 98%`       | `222.2 47.4% 11.2%` | Text on primary                        |
| `bg-secondary`                     | `--secondary`          | `210 40% 96.1%`     | `217.2 32.6% 17.5%` | Secondary surface                      |
| `bg-muted`                         | `--muted`              | `210 40% 96.1%`     | `217.2 32.6% 17.5%` | Muted surface                          |
| `text-muted-foreground`            | `--muted-foreground`   | `215.4 16.3% 35%`   | `215 20.2% 75%`     | Captions, helper text (contrast tuned) |
| `bg-accent`                        | `--accent`             | `210 40% 96.1%`     | `217.2 32.6% 17.5%` | Hover/active accent                    |
| `bg-destructive`                   | `--destructive`        | `0 84.2% 60.2%`     | `0 62.8% 30.6%`     | Destructive / error                    |
| `border-border`                    | `--border`             | `214.3 31.8% 91.4%` | `217.2 32.6% 17.5%` | Default 1px border                     |
| `ring-ring`                        | `--ring`               | `222.2 84% 4.9%`    | `212.7 26.8% 83.9%` | Focus ring                             |

> `muted-foreground` is **deliberately darker than the shadcn default
> (35% instead of 46.9%)** in light mode, and lighter in dark mode, to
> clear WCAG 4.5:1 for body text.

---

## 2.2 · Sidebar tokens

| Token                          | Light               | Dark          |
| ------------------------------ | ------------------- | ------------- |
| `--sidebar-background`         | `222 47% 11%`       | `222 47% 5%`  |
| `--sidebar-foreground`         | `210 40% 98%`       | `210 40% 98%` |
| `--sidebar-primary`            | `217 91% 60%`       | `217 91% 60%` |
| `--sidebar-primary-foreground` | `222 47% 11%`       | `222 47% 5%`  |
| `--sidebar-accent`             | `217 33% 17%`       | `217 33% 12%` |
| `--sidebar-accent-foreground`  | `210 40% 98%`       | `210 40% 98%` |
| `--sidebar-border`             | `217 33% 17%`       | `217 33% 12%` |
| `--sidebar-ring`               | `217.2 91.2% 59.8%` | same          |

Reached via `bg-sidebar`, `text-sidebar-foreground`, `border-sidebar-border`,
etc.

---

## 2.3 · Aerojet brand tokens (light)

Declared under `:root` and overridden in `.dark`. Use these on the **public
marketing surface**, not inside portal chrome.

| Token             | Light HSL      | Hex       | Tailwind class                          |
| ----------------- | -------------- | --------- | --------------------------------------- |
| Aerojet blue      | `213 100% 18%` | `#002a5c` | `text-aerojet-blue` / `bg-aerojet-blue` |
| Aerojet sky       | `210 82% 45%`  | `#1f7ad6` | `text-aerojet-sky` / `bg-aerojet-sky`   |
| Aerojet light     | `204 65% 40%`  | `#2e7eb3` | `text-aerojet-light`                    |
| Aerojet soft-blue | `210 100% 40%` | `#0066ff` | `text-aerojet-soft-blue`                |
| Aerojet slate     | `210 29% 24%`  | `#2c3e50` | `text-aerojet-slate`                    |
| Aerojet offwhite  | `0 0% 98%`     | `#f9f9f9` | `bg-aerojet-offwhite`                   |

### Dark-mode overrides (`.dark`)

| Token              | Dark HSL       | Hex       |
| ------------------ | -------------- | --------- |
| `--aero-blue`      | `213 100% 30%` | `#0050b0` |
| `--aero-sky`       | `210 82% 75%`  | `#a0c8f5` |
| `--aero-light`     | `204 65% 60%`  | `#5fa6d4` |
| `--aero-soft-blue` | `210 100% 60%` | `#66b3ff` |
| `--aero-slate`     | `210 29% 45%`  | `#6585a3` |
| `--aero-offwhite`  | `222 47% 11%`  | `#101e35` |

---

## 2.4 · Public-site tokens

| Token                | Value          | Tailwind class        | Notes                    |
| -------------------- | -------------- | --------------------- | ------------------------ |
| `--public-primary`   | `211 100% 18%` | `bg-public-primary`   | Footer / dark CTAs       |
| `--public-secondary` | `212 82% 61%`  | `bg-public-secondary` | Accent CTA in public nav |
| `--public-dark`      | `216 34% 25%`  | `bg-public-dark`      | Footer surface           |

> These three are **identical between light and dark** in the current CSS
> (the `.dark` block re-declares them at the same HSL). If you want a true
> dark nav/footer, override `--public-*` in the `.dark` block.

---

## 2.5 · Hard-coded page surfaces (not in CSS vars)

Used on the editorial live homepage and the design-lab variants.

| Class            | Hex       | Used in                                |
| ---------------- | --------- | -------------------------------------- |
| `bg-paper`       | `#f7f3ec` | `(public)` editorial page bg           |
| `bg-paper-dark`  | `#efe8dc` | `(public)` editorial hover row         |
| `bg-[#0a1628]`   | `#0a1628` | Hero variants A / D                    |
| `bg-[#0b0e13]`   | `#0b0e13` | Hero variant B                         |
| `bg-[#f7f3ec]`   | `#f7f3ec` | Hero variant C                         |
| `text-[#1b2430]` | `#1b2430` | Editorial body text (Variant C / live) |
| `text-[#0a1628]` | `#0a1628` | Editorial body text (Variant E)        |
| `bg-[#FF4F33]`   | `#FF4F33` | Calendar "+" CTA on dark variant       |
| `bg-[#E6462D]`   | `#E6462D` | Calendar "+" hover                     |

---

## 2.6 · Tailwind class → CSS var → HSL quick lookup

```
aerojet-blue       → hsl(var(--aero-blue))      → 213 100% 18%
aerojet-sky        → hsl(var(--aero-sky))       → 210  82% 45%
aerojet-light      → hsl(var(--aero-light))     → 204  65% 40%
aerojet-soft-blue  → hsl(var(--aero-soft-blue)) → 210 100% 40%
aerojet-slate      → hsl(var(--aero-slate))     → 210  29% 24%
aerojet-offwhite   → hsl(var(--aero-offwhite))  →   0   0% 98%

public-primary     → hsl(var(--public-primary))    → 211 100% 18%
public-secondary   → hsl(var(--public-secondary))  → 212  82% 61%
public-dark        → hsl(var(--public-dark))       → 216  34% 25%

background-light   → #f6f6f8
background-dark    → #101622
paper              → #f7f3ec
paper-dark         → #efe8dc
```
