# 05 · Component library

The component layer is split into three tiers:

1. **shadcn/ui primitives** in `components/ui/*` — headless, Tailwind-only,
   CVA-driven. These are the "atoms" the portal is built from.
2. **Shared composites** in `components/shared/*` — button, modal, theme
   toggle, payment display, currency display, file upload, etc. The portal
   uses these throughout the staff/student/examiner/instructor dashboards.
3. **Marketing sections** in `app/(public)/_components/*` and the
   `components/marketing/sections/` library — page-level heroes, feature
   rows, CTAs, and the editorial programme-list pattern.

## 5.1 · shadcn/ui primitives (Tailwind only)

Built with `class-variance-authority` (CVA) + Radix UI primitives. All
sizes and variants below are extracted from the live code.

### Button (`components/ui/button.tsx`)

```
inline-flex items-center justify-center gap-2
whitespace-nowrap rounded-md
text-sm font-medium
ring-offset-background
transition-colors
focus-visible:outline-none focus-visible:ring-2
focus-visible:ring-ring focus-visible:ring-offset-2
disabled:pointer-events-none disabled:opacity-50
[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0
```

| Variant       | Classes                                                                          |
| ------------- | -------------------------------------------------------------------------------- |
| `default`     | `bg-primary text-primary-foreground hover:bg-primary/90`                         |
| `destructive` | `bg-destructive text-destructive-foreground hover:bg-destructive/90`             |
| `outline`     | `border border-input bg-background hover:bg-accent hover:text-accent-foreground` |
| `secondary`   | `bg-secondary text-secondary-foreground hover:bg-secondary/80`                   |
| `ghost`       | `hover:bg-accent hover:text-accent-foreground`                                   |
| `link`        | `text-primary underline-offset-4 hover:underline`                                |

| Size      | Classes          | Min height |
| --------- | ---------------- | ---------- |
| `default` | `h-11 px-4 py-2` | 44 px ✅   |
| `sm`      | `h-9 px-3`       | 36 px      |
| `lg`      | `h-12 px-10`     | 48 px      |
| `icon`    | `h-11 w-11`      | 44×44 ✅   |

`asChild` prop swaps in Radix `Slot` so you can render as `<Link>` while
keeping all button styling and focus behaviour.

### Card (`components/ui/card.tsx`)

| Sub-component     | Class                                                      |
| ----------------- | ---------------------------------------------------------- |
| `Card`            | `rounded-lg border bg-card text-card-foreground shadow-sm` |
| `CardHeader`      | `flex flex-col space-y-1.5 p-6`                            |
| `CardTitle`       | `text-2xl font-semibold leading-none tracking-tight`       |
| `CardDescription` | `text-sm text-muted-foreground`                            |
| `CardContent`     | `p-6 pt-0`                                                 |
| `CardFooter`      | `flex items-center p-6 pt-0`                               |

### Badge (`components/ui/badge.tsx`)

```
inline-flex items-center rounded-full border
px-2.5 py-0.5 text-xs font-semibold
transition-colors focus:outline-none
focus:ring-2 focus:ring-ring focus:ring-offset-2
```

| Variant       | Classes                                                                                 |
| ------------- | --------------------------------------------------------------------------------------- |
| `default`     | `border-transparent bg-primary text-primary-foreground hover:bg-primary/80`             |
| `secondary`   | `border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80`       |
| `destructive` | `border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80` |
| `outline`     | `text-foreground`                                                                       |

### Other primitives

| Primitive           | Notable styling                                                                           |
| ------------------- | ----------------------------------------------------------------------------------------- |
| `Input`             | `h-11 px-3 py-1 ... border border-input ... focus-visible:ring-2 focus-visible:ring-ring` |
| `Textarea`          | same as Input plus `min-h-[80px]`                                                         |
| `Checkbox`          | `h-4 w-4 shrink-0 rounded-sm border border-primary ... data-[state=checked]:bg-primary`   |
| `Switch`            | `h-6 w-11 ... data-[state=checked]:bg-primary data-[state=unchecked]:bg-input`            |
| `Progress`          | `h-4 w-full overflow-hidden rounded-full bg-secondary`                                    |
| `Avatar`            | `relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full`                           |
| `Tooltip`           | provider delay = 0 (instant)                                                              |
| `Toast` / `Toaster` | Sonner (configured `position=top-right richColors closeButton`)                           |
| `Dialog`            | `max-w-lg` with `fade-in-0 zoom-in-95` + `slide-in-from-top-[48%`                         |
| `Sheet`             | same animation as Dialog, slides from sides                                               |
| `AlertDialog`       | same animation as Dialog                                                                  |
| `DropdownMenu`      | items `px-2 py-1.5 text-sm`, focus = `bg-accent`                                          |
| `Select`            | `h-11` trigger, `text-sm`, focus = `ring-2 ring-ring`                                     |
| `Tabs`              | active state = `bg-background text-foreground shadow-sm`                                  |
| `Accordion`         | uses `accordion-down`/`accordion-up` keyframes (200 ms ease-out)                          |
| `Command` (cmdk)    | used for the public-site search modal                                                     |
| `ScrollArea`        | vertical bar `w-2.5`, horizontal `h-2.5`                                                  |
| `Separator`         | `shrink-0 bg-border`                                                                      |
| `Skeleton`          | `animate-pulse rounded-md bg-muted`                                                       |
| `Form`              | react-hook-form + `@hookform/resolvers/zod` adapter                                       |
| `MultiSelect`       | custom shadcn-style chip input                                                            |
| `MotionTabs`        | animated underline (Framer Motion shared layout)                                          |

## 5.2 · Shared composites (`components/shared/*`)

| File                               | Role                                                                         |
| ---------------------------------- | ---------------------------------------------------------------------------- |
| `ThemeProvider.tsx`                | `next-themes` wrapper, defaultTheme = `light`                                |
| `ThemeToggle.tsx`                  | three-state toggle (light / dark / system)                                   |
| `Modal.tsx`                        | shadcn Dialog wrapper, used heavily in staff / student dashboards            |
| `WalletConfirmModal.tsx`           | destructive confirm CTA pattern (red-600 / red-700)                          |
| `ChangePasswordForm.tsx`           | form-card with success/error animation states (`animate-in fade-in zoom-in`) |
| `CurrencyDisplay.tsx`              | GHS / USD / EUR toggle, click-to-convert, animated states                    |
| `CurrencyToggle.tsx`               | compact currency pill (`active:scale-95`)                                    |
| `CopyButton.tsx`                   | icon + label copy-to-clipboard, "copied" feedback state                      |
| `FileUpload.tsx` / `FileField.tsx` | UploadThing wrappers, drag-and-drop states                                   |
| `TablePagination.tsx`              | prev/next/jump page controls                                                 |
| `TransactionHistory.tsx`           | exam-only panel row                                                          |
| `PoolProgressBar.tsx`              | animated gradient bar, 500 ms width transition                               |
| `BundlePurchaseCard.tsx`           | dark variant purchase card                                                   |
| `WithdrawButton.tsx`               | destructive outlined button                                                  |
| `ReferralPanel.tsx`                | tabbed referral state (link / progress)                                      |
| `AdminPrivacyToggle.tsx`           | emerald-success variant of switch                                            |
| `PrivacyToggle.tsx`                | aerojet-blue variant of switch                                               |
| `PaymentMethodsDisplay.tsx`        | segmented icon toggle for payment methods                                    |
| `WelcomeBanner.tsx`                | dismissible top banner                                                       |
| `AutoRefresh.tsx`                  | polling component for live data                                              |

### Composite design tokens

| Token / class                                                              | Used in                        | Value                           |
| -------------------------------------------------------------------------- | ------------------------------ | ------------------------------- |
| `bg-aerojet-blue`                                                          | Public primary CTAs            | brand blue                      |
| `bg-aerojet-sky`                                                           | Success / live indicator       | brand sky                       |
| `rounded-xl px-6 py-2 font-bold text-white transition-all active:scale-95` | WalletConfirmModal CTA         | `bg-blue-600 hover:bg-blue-700` / `bg-red-600 hover:bg-red-700` |
| `border-aerojet-blue border-t-2 pt-5`                                      | Editorial programme row        | programme-list pattern          |
| `bg-paper` / `bg-paper-dark`                                               | Live editorial page bg / hover | `#f7f3ec` / `#efe8dc`           |
| `text-[#1b2430]/85`                                                        | Live editorial body            | ink on paper                    |
| `first-letter:font-serif first-letter:text-6xl first-letter:font-medium`   | Drop cap                       | first paragraph of "Who we are" |

## 5.3 · Marketing sections (`app/(public)/_components/*`)

The public site is built from these composable blocks. They pull copy from
`app/design-lab/shared.tsx` and from server actions on the page.

| Component                | What it does                                                                |
| ------------------------ | --------------------------------------------------------------------------- |
| `HeroSlider`             | 3-slide autoplay hero with framer-motion word-by-word reveal                |
| `TrustStrip`             | 4-cell stat strip (Part 147 / B1 & B2 / Worldwide / 28 max)                 |
| `SectionReveal`          | generic `motion.div` wrapper for scroll-in reveal                           |
| `ProgramCard`            | individual programme card (used in legacy pages)                            |
| `TrainingPathways`       | "Our Training Pathways" section — `border-t-2 border-aerojet-blue pt-5` row |
| `EnrollmentSteps`        | 4-step card grid (`01` / `02` / `03` / `04`) with hover-fill effect         |
| `Careers`                | "A Career That Takes You Anywhere" running-list of career paths             |
| `UnderstandingLicensing` | B1 / B2 license split with `bg-paper-dark` card                             |
| `Credibility`            | partner logos block                                                         |
| `LatestNews`             | news card grid pulled from Prisma                                           |
| `HomeContact`            | contact CTA strip on `bg-public-primary`                                    |

### The programme-list pattern (editorial)

The signature "newspaper programme table" pattern that runs the live
homepage. Lives in `app/(public)/page.tsx`:

```tsx
<div className="border-t-2 border-[#1b2430]">
  {programmes.map((p, i) => (
    <Link
      key={p.title}
      href={p.href}
      className="group grid items-center gap-3 border-b border-[#1b2430]/15 py-6 transition hover:bg-[#efe8dc] sm:grid-cols-[3rem_1.2fr_2fr_2rem] sm:px-3"
    >
      <span className="font-serif text-2xl text-aerojet-blue/40">
        {String(i + 1).padStart(2, '0')}
      </span>
      <span className="font-serif text-2xl font-medium text-aerojet-blue">
        {p.title}
        {p.badge && (
          <span className="ml-2 align-middle text-[10px] font-bold uppercase tracking-widest text-aerojet-blue/50">
            · {p.badge}
          </span>
        )}
      </span>
      <span className="text-[#1b2430]/70">{p.desc}</span>
      <ArrowRight className="hidden h-5 w-5 text-aerojet-blue transition group-hover:translate-x-1 sm:block" />
    </Link>
  ))}
</div>
```

| Property           | Value                                               |
| ------------------ | --------------------------------------------------- |
| Row separator      | `border-b border-[#1b2430]/15`                      |
| Top-of-list rule   | `border-t-2 border-[#1b2430]`                       |
| Number column      | `font-serif text-2xl text-aerojet-blue/40`          |
| Title column       | `font-serif text-2xl font-medium text-aerojet-blue` |
| Description column | `text-[#1b2430]/70`                                 |
| Trailing arrow     | `text-aerojet-blue ... group-hover:translate-x-1`   |
| Hover fill         | `hover:bg-[#efe8dc]` (= `bg-paper-dark`)            |

## 5.4 · Marketing library (`components/marketing/sections/*`)

The reusable, data-driven section library used to assemble service and
programme marketing pages. See `components/marketing/sections/_shared.tsx`
for the `Cta` / `CtaButton` / `CtaRow` primitives.

| Section           | Role                                         |
| ----------------- | -------------------------------------------- |
| `PageHero`        | Title + subhead + CTA, sets page color story |
| `SectionIntro`    | Eyebrow + heading + deck for a section       |
| `SplitFeature`    | 50/50 text + image (or text + bullets)       |
| `FeatureGrid`     | 3 or 4 feature tiles                         |
| `PillarRows`      | 2-column with vertical rules (editorial)     |
| `ProcessTimeline` | Numbered timeline of steps                   |
| `ImageBand`       | full-bleed photo strip                       |
| `CalloutSlab`     | Inline callout box                           |
| `StatStrip`       | 4-cell stat row                              |

## 5.5 · Layouts (`components/layouts/*`)

| Layout                 | Role                                                                     |
| ---------------------- | ------------------------------------------------------------------------ |
| `PublicNav.tsx`        | Sticky top nav, transparent → white on scroll, `bg-public-secondary` CTA |
| `PublicFooter.tsx`     | Multi-column footer on `bg-public-dark`, `text-gray-400` link list       |
| `DashboardSidebar.tsx` | Collapsible sidebar on `bg-sidebar` (slate-900), `w-20 ↔ w-64`           |
| `MobileNav.tsx`        | Bottom tab bar on mobile (4 cells)                                       |
| `BreadcrumbNav.tsx`    | Truncated middle-item breadcrumb                                         |

## 5.6 · Forbidden patterns

- ❌ No emoji as icons. Always Lucide React (`lucide-react`).
- ❌ No hard-coded `text-white` inside portal chrome — use `text-card-foreground` or a CSS var.
- ❌ No raw `bg-blue-500` / `bg-red-500` etc. on the public site — use the `--aero-*` tokens.
- ❌ No buttons smaller than 44×44 px (WCAG).
- ❌ No default `font-bold` on body — `font-medium` (500) is the heading cap.
- ❌ No `transition-all` on heavy properties — prefer `transition-colors` or `transition-transform`.
- ❌ No silent accessibility drops — every interactive element needs `cursor-pointer`, focus ring, and an accessible label.
