# 07 · Icons, illustrations, and imagery

## 7.1 · Icons

**Library:** `lucide-react` (pinned to `1.8.0` in `package.json`).
**Rule:** no emoji as icons — SVG only, via Lucide.

### Default icon size

The `Button` stylesheet sets `[&_svg]:size-4 [&_svg]:shrink-0
[&_svg]:pointer-events-none`. That makes every icon inside a Button
**16 × 16** with `shrink-0`. To override per icon, use Tailwind
`h-4 w-4` / `h-5 w-5` / `h-6 w-6` / `h-8 w-8`.

| Tailwind class | Pixels | Used for                               |
| -------------- | ------ | -------------------------------------- |
| `h-3 w-3`      | 12 px  | Calendar traffic-light dot             |
| `h-3.5 w-3.5`  | 14 px  | Sidebar collapse chevron               |
| `h-4 w-4`      | 16 px  | Default in Button, dropdown, tab       |
| `h-5 w-5`      | 20 px  | Programme row trailing arrow, calendar |
| `h-6 w-6`      | 24 px  | Empty state, success circle            |
| `h-7 w-7`      | 28 px  | Sidebar logo                           |
| `h-8 w-8`      | 32 px  | Step number circle, modal close        |
| `h-9 w-9`      | 36 px  | Sidebar collapsed menu button          |
| `h-10 w-10`    | 40 px  | Card service icon                      |
| `h-12 w-12`    | 48 px  | Empty state hero icon                  |
| `h-14 w-14`    | 56 px  | Page hero / marketing icon             |
| `h-16 w-16`    | 64 px  | Success / failure illustration         |

### Frequently used icons

| Icon                 | Lucide component         | Used in                             |
| -------------------- | ------------------------ | ----------------------------------- |
| Arrow right          | `ArrowRight`             | Programme row, breadcrumb, hero CTA |
| Arrow right (custom) | `ArrowR` (inline SVG)    | Design-lab variants                 |
| Menu / close         | `Menu` / `X`             | Mobile nav, sheet, dialog           |
| Chevron              | `ChevronDown`            | Accordion, sidebar, dropdown        |
| Check                | `Check` / `CheckCircle2` | Bullet lists, success state         |
| Plus                 | `Plus`                   | Calendar add, "show all"            |
| Alert                | `AlertCircle`            | Form errors, danger                 |
| Eye / EyeOff         | `Eye` / `EyeOff`         | Password reveal toggle              |
| Copy                 | `Copy`                   | Copy-to-clipboard                   |
| Search               | `Search`                 | Public nav search modal             |
| Lock                 | `Lock`                   | Auth pages                          |
| Mail                 | `Mail`                   | Auth, contact form                  |
| Bell                 | `Bell`                   | Notifications (sidebar)             |
| Sun / Moon / Monitor | (ThemeToggle)            | Light / dark / system               |

### Decorative SVG marks

The editorial public site uses three small marks inline:

- `✦` — 4-pointed star, used as list-item terminator
  (`<span className="text-aerojet-blue/40">✦</span>`).
- `▸` — chevron used in dark variants for "step X" markers
  (`<span className="text-amber-400">›</span>`).
- `№ 001` — typography pattern in the design-lab masthead.

These are **typographic glyphs**, not icons, and the rule "no emoji"
applies to UI controls only.

## 7.2 · Imagery

All marketing photography lives in `public/images/`. The
`app/design-lab/shared.tsx` file centralises every image path so a
designer can swap shots in one place.

### Hero set

```
/images/hero/hero-slide1.webp   — students in classroom
/images/hero/hero-slide2.webp   — aircraft on runway
/images/hero/hero-slide3.webp   — engineer inspecting engine
/images/hero/hanger.webp        — interior hangar
/images/hero/lecture.webp       — lecture theatre
/images/hero/lecturer2.webp     — instructor portrait
/images/hero/students.webp      — student cohort
/images/hero/undercarage.webp   — undercarriage close-up
/images/hero/takeoff.webp       — aircraft take-off
/images/hero/aircraft-full.webp — full aircraft on tarmac
```

### Other

```
/images/courses/aircraft-engine-crossection.webp
/images/careers/aircraftcareers.webp
/images/home/al4.webp
```

### Imagery rules

- Format: `.webp` (Next/Image + Sharp pipeline).
- Quality: `quality={90}` on the live homepage hero.
- Sizes hint: `sizes="(max-width: 1024px) 100vw, 50vw"`.
- `priority` is set on the LCP candidate (`/images/home/al4.webp`).
- Optional `sepia-[0.15]` filter on the editorial "Who We Are" portrait.
- `aspect-3/4` (Tailwind 4) on hero portrait frames.
- All images are optimised through `sharp` (`package.json`) and resized
  via `convertImages.js` in the repo root.

## 7.3 · 3D / Vanta.js

`vanta` + `three` are installed (used by some portal pages for subtle
background effects) — see `package.json`. Not currently on the public
site. Treat as opt-in decoration only.

## 7.4 · Logo

The Aerojet wordmark / brand logo is held in
`public/favicon.ico` and `public/apple-touch-icon.webp` (referenced
from `app/layout.tsx` `metadata.icons`). Brand mark for the live site
is composed of the typographic "Aerojet" wordmark + a small icon, but
there is no separate SVG logo file in the repo yet — that is a known
gap to close.

## 7.5 · Brand voice in writing

Editorial public-site copy follows a few rules:

- **Sentence case** for H1/H2 (e.g. "Building the future of African
  aviation") — never ALL CAPS headings.
- **ALL CAPS** is reserved for short eyebrow / category labels
  (`— WHO WE ARE`, `PROGRAMMES`, `STEP_01`).
- Drop cap on the first paragraph of "Who We Are".
- Numbers: two-digit zero-pad (`01`, `02`).
- Always mention **EASA Part-66 / Part-145** and **Ghana** on the
  first screen of the public site.
