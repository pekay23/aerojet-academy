# 04 · Sizing, spacing, layout

## 4.1 · Border radius

`--radius` is set to `0.5rem` (8px) in `app/globals.css`. The Tailwind
config re-exports `lg/md/sm` in terms of that variable.

| Token          | Value                              | Use                               |
| -------------- | ---------------------------------- | --------------------------------- |
| `rounded-sm`   | `calc(var(--radius) - 4px)` = 4 px | Tight inputs, badges              |
| `rounded-md`   | `calc(var(--radius) - 2px)` = 6 px | Default `Button`, `Card`, `Input` |
| `rounded-lg`   | `var(--radius)` = 8 px             | Larger cards, sheets              |
| `rounded-xl`   | 12 px (Tailwind default)           | Marketing CTAs                    |
| `rounded-2xl`  | 16 px                              | Marketing feature tiles           |
| `rounded-3xl`  | 24 px                              | Hero image frames                 |
| `rounded-4xl`  | 32 px                              | Variant D hero block              |
| `rounded-full` | 9999 px                            | Pills, chips, avatar              |

## 4.2 · Component sizes (shadcn)

| Component           | Size      | Class               | Touch target      |
| ------------------- | --------- | ------------------- | ----------------- |
| `Button`            | `default` | `h-11 px-4 py-2`    | **44×44** ✅ WCAG |
| `Button`            | `sm`      | `h-9 px-3`          | 36×32             |
| `Button`            | `lg`      | `h-12 px-10`        | 48×≥40            |
| `Button`            | `icon`    | `h-11 w-11`         | 44×44             |
| `Input`             | default   | `h-11`              | 44                |
| `Switch`            | thumb     | `h-5 w-5`           | —                 |
| `Avatar`            | default   | `h-10 w-10`         | —                 |
| `Dialog`            | default   | `max-w-lg` (512 px) | —                 |
| `Sheet`             | default   | `max-w-sm` (384 px) | —                 |
| `Progress`          | default   | `h-4`               | —                 |
| `DropdownMenu item` | default   | `px-2 py-1.5`       | —                 |

> Touch target rule: every interactive element must be ≥ 44×44 px
> (WCAG 2.5.5 AAA / Apple HIG). The portal enforces this on `Button` and
> `Switch`.

## 4.3 · Spacing rhythm

Tailwind 4-pt scale is used everywhere. The most common values across the
codebase:

| Tailwind class | px  | Used for                                   |
| -------------- | --- | ------------------------------------------ |
| `p-1` / `m-1`  | 4   | Tight inline gaps                          |
| `p-2` / `m-2`  | 8   | Component inner padding, gap between icons |
| `p-3` / `m-3`  | 12  | Card padding (compact), button px          |
| `p-4` / `m-4`  | 16  | Card padding (default), `py-4` section gap |
| `p-5` / `m-5`  | 20  | Section-level outer padding                |
| `p-6` / `m-6`  | 24  | shadcn `Card` body, section gutters        |
| `p-7` / `m-7`  | 28  | Variant D hero block                       |
| `p-8` / `m-8`  | 32  | Marketing tile padding                     |
| `px-6`         | 24  | Editorial section horizontal padding       |
| `py-12`        | 48  | Default section padding                    |
| `py-16`        | 64  | Section padding (lg)                       |
| `py-20`        | 80  | Section padding (xl)                       |
| `py-24`        | 96  | Section padding (2xl, marketing variant)   |
| `py-32`        | 128 | Section padding (3xl, marketing variant)   |

## 4.4 · Page layout widths

| Container       | Max width   | Used in                                      |
| --------------- | ----------- | -------------------------------------------- |
| Editorial prose | `max-w-2xl` | Hero sub-headline (Variant C)                |
| Card grid       | `max-w-4xl` | Variant C hero stats                         |
| Form / dialog   | `max-w-md`  | Global error card, login form                |
| Marketing       | `max-w-7xl` | `(public)/page.tsx` sections, Variant D hero |
| Public prose    | `max-w-2xl` | Hero sub-headline                            |

`mx-auto px-6` is the standard section wrapper.

## 4.5 · Z-index scale

Default Tailwind values, plus three custom values in `tailwind.config.ts`:

| Token        | Value | Used in                            |
| ------------ | ----- | ---------------------------------- |
| `z-50`       | 50    | Modals, dropdowns, sticky nav      |
| `z-60`       | 60    | Custom — public-nav scrolled state |
| `z-70`       | 70    | Custom — public mobile menu open   |
| `z-80`       | 80    | Custom — sidebar close (mobile)    |
| `z-50` focus | 50    | Skip-link when focused             |

## 4.6 · Shadows

| Tailwind class                        | Used in                               |
| ------------------------------------- | ------------------------------------- |
| `shadow-sm`                           | shadcn `Card` default                 |
| `shadow-lg`                           | Floating nav, modal                   |
| `shadow-xl`                           | Hero CTA cards                        |
| `shadow-2xl`                          | Variant A "100% EASA Standards" badge |
| `shadow-aerojet-blue/20`              | Custom shadow color tinting           |
| `shadow-[#FF4F33]/20`                 | Custom shadow color tinting (red CTA) |
| `shadow-[0_1px_4px_rgba(0,0,0,0.06)]` | Custom table row hover shadow         |

The `shadow-aerojet-blue/20` pattern shows the team is comfortable with
arbitrary `shadow-{color}/{opacity}` Tailwind 4 syntax.

## 4.7 · Grid & flex patterns

| Pattern                            | Class signature                                  |
| ---------------------------------- | ------------------------------------------------ |
| Editorial two-column with drop cap | `sm:columns-2` + `first-letter:` utilities       |
| Marketing 2-up with image          | `grid gap-12 lg:grid-cols-[1.4fr_1fr] lg:gap-16` |
| Marketing 3-up                     | `grid sm:grid-cols-2 lg:grid-cols-3`             |
| Marketing 4-up                     | `grid sm:grid-cols-2 lg:grid-cols-4`             |
| Programme list                     | `sm:grid-cols-[3rem_1.2fr_2fr_2rem]`             |
| Stat strip                         | `grid grid-cols-2 lg:grid-cols-4`                |
| License B1/B2 split                | `grid lg:grid-cols-2`                            |
| Hero split (text + image)          | `grid lg:grid-cols-[1.2fr_1fr]`                  |
