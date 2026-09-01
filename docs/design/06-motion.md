# 06 · Motion & interaction

The portal deliberately keeps motion **short, restrained, and
purposeful** — no parallax, no scroll-jacking, no long reveals.

## 6.1 · Core durations

| Duration   | Used for                                                         |
| ---------- | ---------------------------------------------------------------- | ----------------------------------- |
| 120 ms     | Tiny colour swaps (link underline, icon recolour)                |
| 150 ms     | Sidebar items, button hover (shadcn `transition-colors` default) |
| 160 ms     | `he-card` lift on hover (docs/html docs.css)                     |
| 200 ms     | `transition-colors` on most interactive bits; Accordion content  |
| 250 ms     | Sheet, Dialog, Tabs content fade                                 |
| 300 ms     | Public nav scroll state transition                               |
| 500 ms     | Pool progress bar fill, currency display                         |
| 200–500 ms | shadcn `data-[state=open                                         | closed]:animate-\*` (Dialog, Sheet) |

## 6.2 · Easing curves

The codebase uses Tailwind 4's defaults and Framer Motion's spring
defaults. Easing is **almost never overridden** — keep that.

| Curve                              | Used in                              |
| ---------------------------------- | ------------------------------------ |
| `ease-out`                         | Accordion open/close (200 ms)        |
| `ease-in-out`                      | shadcn Sheet (300 ms in, 500 ms out) |
| `cubic-bezier(0.22, 1, 0.36, 1)` | `SectionReveal` scroll-in fade       |
| spring (stiffness 100, damping 20) | `MotionTabs` underline shared layout |

## 6.3 · Keyframes

Two keyframes are declared in `tailwind.config.ts` and consumed by
`Accordion`:

```ts
'accordion-down': {
  from: { height: '0' },
  to:   { height: 'var(--radix-accordion-content-height)' },
},
'accordion-up': {
  from: { height: 'var(--radix-accordion-content-height)' },
  to:   { height: '0' },
},
animation: {
  'accordion-down': 'accordion-down 0.2s ease-out',
  'accordion-up':   'accordion-up   0.2s ease-out',
}
```

shadcn ships a long list of `animate-in / animate-out` keyframes (fade,
zoom, slide) that the Dialog, Sheet, AlertDialog, Toast, etc. all
re-use via the `tailwindcss-animate` plugin.

## 6.4 · Framer Motion patterns

### `SectionReveal` (live site)

```tsx
<motion.div
  initial={{ opacity: 0, y: 24 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, margin: '-120px' }}
  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
>
```

Used by every section in `app/(public)/_components/*`. Delay is 0 by
default and staggered by 0.05–0.1 s per row for the programme list.

### Hero headline reveal

```tsx
// app/(public)/_components/HeroSlider.tsx
<div className="mb-6 flex items-center justify-center gap-4 text-[11px] font-bold tracking-[0.35em] text-white/90 uppercase">
  <span className="h-px w-12 bg-white/40" />
  EASA Part-66 · Accra, Ghana
  <span className="h-px w-12 bg-white/40" />
</div>
<h1 className="mb-6 font-serif text-4xl leading-[1.06] font-medium tracking-tight text-white md:text-6xl lg:text-7xl">
  {slides[currentSlide].headline.split(' ').map((word, i) => (
    <span key={i} className="mr-[0.25em] inline-block last:mr-0">
      {word}
    </span>
  ))}
</h1>
```

The headline is split into static `<span>` elements inside a single
`motion.div` parent; there is no per-word Framer Motion animation.
The parent handles the slide transition (`initial={{ opacity: 0, y: 30 }}`
/ `animate={{ opacity: 1, y: 0 }}` / `exit={{ opacity: 0, y: -20 }}`).

### `MotionTabs` sliding pill

Uses Framer Motion's `layoutId` so the active tab pill slides between
tabs. The default `layoutId` is `"motion-pill"` (overridable via the
`layoutId` prop):

```tsx
<motion.div
  layoutId="motion-pill"
  className="absolute inset-0 rounded-full bg-white shadow-sm dark:bg-slate-900"
  style={{ zIndex: 0 }}
  transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }}
/>
```

A separate hover highlight uses the same spring config with
`layoutId="${layoutId}-hover"` and `bg-slate-200/50 dark:bg-slate-700/50`.

### `ChangePasswordForm` form-state animation

Uses shadcn's `animate-in` / `animate-out` for the success state:

```
animate-in fade-in zoom-in ... duration-300
animate-in slide-in-from-top-1 ... duration-200
```

## 6.5 · GSAP

`gsap` + `@gsap/react` are installed (`package.json`) and the
`@gsap/react` hook is used in `app/design-lab/FeedbackOverlay.tsx`.
No production page currently consumes it — treat as a design-lab tool
for prototyping future scroll-driven motion.

## 6.6 · Hover patterns

| Pattern                                         | Used in                              |
| ----------------------------------------------- | ------------------------------------ |
| `hover:translate-x-1` on arrow                  | Programme rows, see `_components`    |
| `hover:border-aerojet-sky` + colour swap        | Editorial links                      |
| `hover:scale-105` (Tailwind 4)                  | Calendar event chips, marketing CTAs |
| `hover:scale-[1.02]`                            | Calendar save button                 |
| `hover:bg-[#efe8dc]`                            | Programme row hover fill             |
| `hover:opacity-80` (with `active:scale-[0.98]`) | Currency display click-to-toggle     |
| `active:scale-95`                               | Sidebar menu button, copy button     |
| `group-hover:translate-x-1` on icon             | Editorial CTAs                       |

## 6.7 · Focus & accessibility motion

- All interactive elements get a visible focus ring (2 px, 2 px offset)
  using `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`.
- The skip-link at the top of every page is `sr-only focus:not-sr-only` and
  lands at `inset-4 z-50 rounded-lg bg-white px-4 py-2 font-bold shadow-lg`.
- `body.exam-lockdown` is a hard mode used during exams: it strips the
  sidebar, sticky elements, breadcrumb, and registration banners
  (`app/globals.css` lines 117-136).
- `prefers-reduced-motion` is **not yet honored** — the codebase does
  not query `matchMedia('(prefers-reduced-motion: reduce)')` anywhere.
  Dark mode is class-driven, but system theme detection does use
  `matchMedia('(prefers-color-scheme: dark)')` in
  `components/shared/theme-provider.tsx`.

## 6.8 · Loading & skeleton patterns

- `Skeleton` from shadcn: `animate-pulse rounded-md bg-muted`.
- `aria-busy` is set on busy buttons (`ChangePasswordForm`, calendar
  save button).
- Buttons in a busy state get `disabled:opacity-50 disabled:pointer-events-none`
  plus the same `aria-busy` attribute.
