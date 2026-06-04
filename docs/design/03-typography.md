# 03 · Typography

## 3.1 · Loaded families

All three are loaded via `next/font/google` with `display: 'swap'` and
exposed as CSS variables on `<html>` (`app/layout.tsx`):

| Family               | CSS var           | Weights (default) | Used for                                           |
| -------------------- | ----------------- | ----------------- | -------------------------------------------------- |
| **Inter**            | `--font-inter`    | 400–700           | `font-sans` default — body, portal UI              |
| **Outfit**           | `--font-outfit`   | 400–900           | Design-lab variants, marketing headlines           |
| **Playfair Display** | `--font-playfair` | 400–700           | Live public-site editorial headings (`font-serif`) |

```ts
// app/layout.tsx
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit', display: 'swap' })
const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})
```

## 3.2 · Tailwind font family aliases

```
font-sans    → var(--font-inter) → system-ui → sans-serif
font-outfit  → var(--font-outfit) → sans-serif
font-heading → var(--font-cal)   → var(--font-inter) → system-ui → sans-serif
font-serif   → var(--font-playfair) → Georgia → serif
```

> `font-heading` is declared but the `--font-cal` variable is **not loaded
> in `app/layout.tsx` yet** — it falls through to Inter. Consider this a
> stub for a future "Cal Sans" or similar.

## 3.3 · Live-site type scale (Variant C / editorial)

Pulled from the actual `(public)/_components/*.tsx` and `(public)/page.tsx`:

| Role              | Class                                                                    | Size       | Weight              | Tracking                  |
| ----------------- | ------------------------------------------------------------------------ | ---------- | ------------------- | ------------------------- |
| Hero H1           | `font-serif text-4xl ... sm:text-6xl lg:text-7xl`                        | 4 rem      | `font-medium` (500) | `tracking-tight` (0.04em) |
| Section H2        | `font-serif text-3xl font-medium sm:text-4xl`                            | 1.875 rem  | 500                 | default                   |
| H3 / Card title   | `font-serif text-2xl font-medium`                                        | 1.5 rem    | 500                 | default                   |
| Eyebrow           | `text-[11px] font-bold tracking-[0.3em] uppercase`                       | 0.6875 rem | 700                 | `0.3em` wide              |
| Body lead         | `text-lg leading-relaxed text-[#1b2430]/85`                              | 1.125 rem  | 400                 | —                         |
| Body              | `text-base leading-relaxed`                                              | 1 rem      | 400                 | —                         |
| Drop cap          | `first-letter:font-serif first-letter:text-6xl first-letter:font-medium` | 3.75 rem   | 500                 | `leading-[0.8]`           |
| Nav CTA           | `text-xs font-black tracking-[0.25em] uppercase`                         | 0.75 rem   | 900                 | `0.25em`                  |
| Stat number       | `font-serif text-3xl font-medium`                                        | 1.875 rem  | 500                 | —                         |
| Stat label        | `text-[10px] font-bold tracking-[0.2em] uppercase`                       | 0.625 rem  | 700                 | `0.2em`                   |
| Mono caption      | `font-mono text-[11px] tracking-wide`                                    | 0.6875 rem | 500                 | `0.025em`                 |
| Tiny "header row" | `text-[11px] font-semibold tracking-[0.25em] uppercase`                  | 0.6875 rem | 600                 | `0.25em`                  |

## 3.4 · Portal / dashboard type scale (shadcn/ui defaults)

| Role           | Class                                                | Notes                 |
| -------------- | ---------------------------------------------------- | --------------------- |
| H1             | `text-4xl font-semibold tracking-tight`              | Page header           |
| H2             | `text-3xl font-semibold`                             | Section               |
| H3 / CardTitle | `text-2xl font-semibold leading-none tracking-tight` | Card title            |
| Body           | `text-sm text-muted-foreground`                      | Default body in cards |
| Small / cap    | `text-xs font-medium`                                | Inline meta           |

## 3.5 · Button / Badge / Input text

- `Button` default body: `text-sm font-medium`.
- `Badge`: `text-xs font-semibold`.
- `Input` height: `h-11` (44px — WCAG min touch target).
- `Link` body: underline only on hover (no default underline).
- `muted-foreground` is the safe-caption color in both modes.

## 3.6 · Weight semantics

The portfolio uses the same `500` / `700` / `900` pattern across all three
families. Treat these as semantic:

| Weight | Tailwind class       | Role                                       |
| ------ | -------------------- | ------------------------------------------ |
| 400    | (default / no class) | Body copy                                  |
| 500    | `font-medium`        | Section H2/H3 headings, hero H1 (Playfair) |
| 600    | `font-semibold`      | shadcn/ui CardTitle / Button on dark       |
| 700    | `font-bold`          | Editorial eyebrow, drop-cap emphasis       |
| 800    | `font-extrabold`     | (Unused — reserved for future)             |
| 900    | `font-black`         | Marketing CTA labels, design-lab variants  |

## 3.7 · Letter-spacing cheat-sheet

| Tailwind class      | Value (em) | Used in                                    |
| ------------------- | ---------- | ------------------------------------------ |
| `tracking-tighter`  | −0.05em    | Variant D hero ("CERTIFIED")               |
| `tracking-tight`    | −0.025em   | Editorial H1/H2                            |
| `tracking-normal`   | 0          | Body                                       |
| `tracking-wide`     | 0.025em    | Mono captions                              |
| `tracking-wider`    | 0.05em     | Calendar fig-captions                      |
| `tracking-widest`   | 0.1em      | "P-01", "STEP_01", labels with `font-mono` |
| `tracking-[0.2em]`  | 0.2em      | Stat labels, small uppercase               |
| `tracking-[0.25em]` | 0.25em     | Public nav CTA, masthead caps              |
| `tracking-[0.3em]`  | 0.3em      | Editorial eyebrow ("— Who We Are")         |
| `tracking-[0.35em]` | 0.35em     | Section header in Variant C                |
| `tracking-[0.4em]`  | 0.4em      | Design-lab A/B eyebrows (most spaced)      |

## 3.8 · Line-height cheat-sheet

| Tailwind class    | Value | Role                                 |
| ----------------- | ----- | ------------------------------------ |
| `leading-none`    | 1     | CardTitle / tightly tracked headings |
| `leading-tight`   | 1.25  | Hero H1 (default for `text-7xl`)     |
| `leading-snug`    | 1.375 | (Unused — reserved)                  |
| `leading-normal`  | 1.5   | Default body                         |
| `leading-relaxed` | 1.625 | Editorial body, lead paragraphs      |
| `leading-[1.04]`  | 1.04  | Variant A hero (`font-semibold`)     |
| `leading-[1.05]`  | 1.05  | Variant D hero (marketing-style)     |
| `leading-[1.06]`  | 1.06  | Variant C hero                       |
| `leading-[1.08]`  | 1.08  | Variant A H2                         |
| `leading-[1.1]`   | 1.1   | H2 (editorial)                       |
| `leading-[0.95]`  | 0.95  | Variant D "CERTIFIED" line           |
| `leading-[0.8]`   | 0.8   | Drop cap                             |
