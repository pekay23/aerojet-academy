s # 01 · Foundations

> Brand voice, color hex cheat-sheet, and where everything in the design
> system actually lives. See `02-colors.md`, `03-typography.md`,
> `04-sizing.md`, `05-components.md`, `06-motion.md`, `07-icons-illustrations.md`
> for the deep references.

## Voice & visual language

- **Editorial / aviation-meets-luxury.** Headings in a serif (Playfair) for
  the public site; a geometric sans (Outfit) for the design-lab and a
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

## Where every token comes from

| Concern               | File                                         |
| --------------------- | -------------------------------------------- |
| Color & font CSS vars | `app/globals.css`                            |
| Tailwind theme        | `tailwind.config.ts`                         |
| shadcn/ui base        | `components.json` (`baseColor: slate`)       |
| shadcn/ui tokens      | `components/ui/*`                            |
| Public nav colors     | `components/layouts/PublicNav.tsx`           |
| Font loading          | `app/layout.tsx` (Inter / Outfit / Playfair) |
| Dark mode toggle      | `next-themes` (`app/providers.tsx`)          |
| Theme defaults (DB)   | `ThemeConfig` Prisma model                   |
| Brand examples        | `app/(public)/_components/*.tsx`             |
| Home variants         | `app/design-lab/variants/*.tsx`              |

## Color hex cheat-sheet

| Token                | HSL            | Hex       | Role                              |
| -------------------- | -------------- | --------- | --------------------------------- |
| `--aero-blue`        | `213 100% 18%` | `#002a5c` | Brand primary / headings on paper |
| `--aero-sky`         | `210 82% 45%`  | `#1f7ad6` | Accent / interactive (light)      |
| `--aero-light`       | `204 65% 40%`  | `#2e7eb3` | Mid-blue hover / link state       |
| `--aero-soft-blue`   | `210 100% 40%` | `#0066ff` | Focus ring / CTA hover            |
| `--aero-slate`       | `210 29% 24%`  | `#2c3e50` | Body / heading on light bg        |
| `--aero-offwhite`    | `0 0% 98%`     | `#f9f9f9` | Off-white surface                 |
| `--public-primary`   | `211 100% 18%` | `#002347` | Public nav / footer primary       |
| `--public-secondary` | `212 82% 61%`  | `#4993e4` | Public nav CTA / accents          |
| `--public-dark`      | `216 34% 25%`  | `#2f3e57` | Footer text / dark surface        |
| `bg-paper`           | —              | `#f7f3ec` | Editorial page background         |
| `bg-paper-dark`      | —              | `#efe8dc` | Editorial card surface            |
| `background-light`   | —              | `#f6f6f8` | Dashboard light surface           |
| `background-dark`    | —              | `#101622` | Dashboard dark surface            |
| Sidebar bg (light)   | `222 47% 11%`  | `#0f172a` | Slate-900 dashboard chrome        |

> ⚠️ All brand blues were deliberately **darkened from their HSL
> prototypes** to meet WCAG AA 4.5:1 contrast against white. Comments in
> `app/globals.css` preserve the original light-mode values for reference.
