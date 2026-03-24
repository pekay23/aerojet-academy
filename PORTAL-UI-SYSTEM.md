# Portal UI/UX Design System — AI Agent Prompt

> **Purpose:** Drop this file into any Next.js + Tailwind CSS + shadcn/ui project and instruct your AI agent to follow it. It will replicate the exact portal shell, layout patterns, component conventions, and responsive behaviors described below. Theme colors are intentionally omitted — define your own palette and the system adapts.

---

## Tech Stack Requirements

- **Framework:** Next.js (App Router, server components by default, `"use client"` where needed)
- **Styling:** Tailwind CSS v4 with CSS custom properties for theming
- **Components:** shadcn/ui (Card, Table, Button, Badge, Popover, Sheet, Skeleton, Avatar, DropdownMenu, Tooltip, Input, Dialog)
- **Icons:** lucide-react
- **Date formatting:** date-fns
- **State:** React useState + localStorage for sidebar collapse persistence
- **Auth:** NextAuth v5 / Auth.js (session-based role detection)

---

## 1. Portal Shell Architecture

The portal is a full-viewport flex layout with three zones: **fixed sidebar**, **sticky header**, and **scrollable main content**.

```
┌──────────┬──────────────────────────────────┐
│          │  HEADER (sticky, glassmorphism)   │
│ SIDEBAR  ├──────────────────────────────────┤
│ (fixed)  │                                  │
│          │  MAIN CONTENT (scrollable)        │
│          │                                  │
│          ├──────────────────────────────────┤
│          │  FOOTER (subtle)                 │
└──────────┴──────────────────────────────────┘
```

### Outer Container
```
min-h-screen flex overflow-x-hidden bg-background text-foreground selection:bg-primary/20 selection:text-primary
```

### Main Content Wrapper
```
flex-1 flex flex-col min-h-screen overflow-x-hidden transition-all duration-300 ease-in-out
```
- Margin adjusts based on sidebar: `lg:ml-20` (collapsed) or `lg:ml-64` (expanded)
- Main element: `flex-1 p-4 lg:px-6 lg:py-8 w-full`
- **No max-width constraint** — content fills available width

### Footer
```
p-6 border-t border-border/50 text-center
```
- Text: `text-[11px] font-medium text-muted-foreground uppercase tracking-widest opacity-50`

---

## 2. Sidebar

### Dimensions & Behavior
- **Expanded width:** `w-64` (256px)
- **Collapsed width:** `w-20` (80px)
- **Position:** `fixed top-0 left-0 bottom-0 z-40`
- **Visibility:** `hidden lg:flex lg:flex-col` (desktop only)
- **Styling:** `bg-sidebar border-r border-sidebar-border/50 shadow-sm`
- **Transition:** `transition-all duration-300 ease-in-out`
- **Collapse state:** Persisted to `localStorage` with key `portal-collapsed-{portalSlug}`

### Structure
```
┌─────────────────────┐
│  Logo + Collapse Btn │  h-16
├─────────────────────┤
│  Navigation Sections │  flex-1, overflow-y-auto no-scrollbar
│    Section Label     │
│    Nav Item          │
│    Nav Item          │
│    ...               │
├─────────────────────┤
│  User Menu           │  mt-auto, border-t border-border
└─────────────────────┘
```

### Navigation Items

**Expanded:**
```
group relative flex items-center gap-3 rounded-lg px-3 py-2 transition-all duration-200 font-medium
```
- **Active:** `bg-sidebar-accent text-sidebar-accent-foreground shadow-sm` + left indicator bar (`absolute left-0 top-2 bottom-2 w-1 bg-primary rounded-r-full`)
- **Inactive:** `text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground`
- **Icon:** `w-4 h-4 shrink-0 transition-colors` — active: `text-primary`, inactive: `opacity-70 group-hover:opacity-100`

**Collapsed:**
- Same but `justify-center p-2.5`, label hidden, wrapped in `<Tooltip>`

### Section Labels
```
px-3 mb-2.5 text-[10px] font-bold uppercase tracking-[0.1em] text-sidebar-foreground/40
```
- First section: `mt-0`, subsequent: `mt-8`
- Items within section: `space-y-1`

### User Menu (Bottom)
- **Avatar:** `w-8 h-8 rounded-md bg-primary text-[11px] font-bold text-primary-foreground shadow-sm` — shows 2-letter initials
- **Name:** `text-xs font-semibold truncate leading-tight`
- **Role:** `text-[10px] opacity-70 truncate font-medium`
- **Dropdown:** Settings, Theme toggle (Light/Dark/System cycle), Website link, Sign out

### Mobile Sidebar
- Uses shadcn `<Sheet>` component, `side="left"`, `w-72`
- Styling: `p-0 bg-sidebar border-sidebar-border/50`
- Trigger: hamburger menu button in header, visible only `lg:hidden`

---

## 3. Header

```
sticky top-0 z-30 h-16 bg-background/80 backdrop-blur-md border-b border-border flex items-center justify-between px-4 lg:px-8
```

### Left Side
```
flex items-center gap-4 min-w-0 overflow-hidden
```
- Mobile menu button: `lg:hidden p-2 -ml-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors`
- `<Breadcrumbs />` component (auto-generated from pathname)

### Right Side
```
flex items-center gap-3 shrink-0
```

**Date Display** (hidden below 1100px):
```
hidden min-[1100px]:flex items-center gap-2.5 px-3 py-1.5 bg-muted/30 border border-border/50 rounded-xl mr-2
```
- Icon: `Calendar w-3.5 h-3.5 text-primary`
- Text: `text-[10px] font-black uppercase tracking-widest text-muted-foreground whitespace-nowrap`
- Format: `EEEE, MMMM do` (e.g., "Monday, March 23rd")

**Search Popover:**
- Trigger: `p-2 rounded-xl` — active: `bg-primary text-primary-foreground`
- Content: `w-72 md:w-96 rounded-2xl p-2`
- Input: `pl-10 pr-10 py-2.5 h-10 rounded-xl font-bold`

**Notifications Popover:**
- Trigger: `p-2 rounded-xl relative`
- Unread dot: `absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border-2 border-background animate-pulse`
- Content: `w-80 rounded-2xl p-0 overflow-hidden`
- Header: `p-4 border-b border-border bg-muted/20` with `text-xs font-black uppercase tracking-widest`
- List: `max-h-96 overflow-y-auto no-scrollbar`
- Item: `w-full p-4 border-b border-border/50 hover:bg-muted/30 flex items-start gap-4` — unread: `bg-primary/5`
- Notification icon: `w-9 h-9 rounded-xl flex items-center justify-center border border-current shrink-0`

### Breadcrumbs
- Auto-generated from URL pathname segments
- Separator: `ChevronRight w-4 h-4 text-muted-foreground/50`
- Links: `flex items-center gap-1 hover:text-foreground transition-colors`
- Current page: `font-medium text-foreground` (not a link)
- Hidden when only one segment (root)

---

## 4. Page Patterns

### 4a. Dashboard Page

**Page wrapper:**
```
space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12
```

**Header section:**
```html
<div>
  <h1 class="text-2xl font-extrabold text-foreground tracking-tight">Dashboard Title</h1>
  <p class="text-muted-foreground text-sm mt-1">Welcome message or subtitle.</p>
</div>
```

**Stat Cards Grid:**
```
grid grid-cols-2 lg:grid-cols-3 gap-4
```
— or `grid-cols-3` if 3 stats, `grid-cols-2 lg:grid-cols-4` if 4 stats

Each stat card:
```html
<Card>
  <CardContent class="p-5 flex items-center gap-4">
    <div class="w-11 h-11 bg-{color}-500/10 rounded-xl flex items-center justify-center shrink-0 border border-{color}-500/20">
      <Icon class="w-5 h-5 text-{color}-500" />
    </div>
    <div>
      <p class="text-xs text-muted-foreground font-medium">Label</p>
      <p class="text-2xl font-extrabold text-foreground tabular-nums">42</p>
    </div>
  </CardContent>
</Card>
```

**Color assignments for stat icons:**
- Active/Pending: amber-500
- Completed/Resolved: emerald-500
- Total/Info: blue-500
- Primary/Status: primary

**Content Section:**
```html
<Card>
  <CardHeader class="pb-0">
    <div class="flex items-center justify-between">
      <CardTitle class="text-base font-bold flex items-center gap-2">
        <Icon class="w-4 h-4 text-muted-foreground" /> Section Title
      </CardTitle>
      <Button variant="ghost" size="sm" asChild>
        <Link href="/path">View All</Link>
      </Button>
    </div>
  </CardHeader>
  <CardContent class="pt-4">
    <!-- Desktop table (hidden md:block) + Mobile cards (md:hidden) -->
  </CardContent>
</Card>
```

**Empty State:**
```html
<div class="py-16 text-center">
  <Icon class="w-10 h-10 text-muted-foreground/20 mx-auto mb-4" />
  <p class="text-sm text-muted-foreground">No items yet.</p>
</div>
```

---

### 4b. List Page

**Header:**
```html
<div>
  <h1 class="text-2xl font-extrabold text-foreground tracking-tight">Page Title</h1>
  <p class="text-muted-foreground text-sm mt-1">You have X active items.</p>
</div>
```

**Desktop Table** (`hidden md:block`):
```html
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Type</TableHead>
      <TableHead>Status</TableHead>
      <TableHead>Date</TableHead>
      <TableHead class="text-right" />
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow class="group">
      <TableCell>
        <div>
          <p class="font-semibold text-foreground text-sm">Primary text</p>
          <p class="text-xs text-muted-foreground line-clamp-1">Secondary text</p>
        </div>
      </TableCell>
      <TableCell><!-- Type badge --></TableCell>
      <TableCell><!-- Status badge --></TableCell>
      <TableCell class="text-xs text-muted-foreground whitespace-nowrap">
        {format(date, "MMM d, h:mm a")}
      </TableCell>
      <TableCell class="text-right">
        <Link class="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline">
          View <ArrowRight class="w-3.5 h-3.5" />
        </Link>
      </TableCell>
    </TableRow>
  </TableBody>
</Table>
```

**Mobile Cards** (`md:hidden space-y-3`):
```html
<Link class="block p-4 bg-muted/20 rounded-xl border border-border hover:border-primary/30 transition-colors">
  <div class="flex items-center justify-between mb-2">
    <div class="flex items-center gap-2">
      <!-- Type badge + Status badge -->
    </div>
    <ArrowRight class="w-4 h-4 text-muted-foreground" />
  </div>
  <p class="font-semibold text-foreground text-sm">Name</p>
  <p class="text-xs text-muted-foreground line-clamp-1 mt-1">Description</p>
  <div class="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
    <span class="flex items-center gap-1"><Clock class="w-3 h-3" /> {date}</span>
  </div>
</Link>
```

---

### 4c. Detail Page

**Back button:**
```
inline-flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest hover:text-foreground transition-colors group
```
- Arrow: `w-4 h-4 transition-transform group-hover:-translate-x-1`

**Header:**
```html
<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
  <div>
    <div class="flex items-center gap-3 mb-2">
      <span class="text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest border {statusBadgeClasses}">
        {statusLabel}
      </span>
      <span class="text-muted-foreground text-xs font-medium">#{id}</span>
    </div>
    <h1 class="text-2xl font-extrabold text-foreground tracking-tight">Title</h1>
  </div>
</div>
```

**Quick Actions (2-column grid):**
```html
<div class="grid grid-cols-2 gap-3">
  <a class="flex items-center gap-3 bg-card hover:bg-muted/50 p-4 rounded-xl border border-border transition-colors">
    <div class="w-10 h-10 bg-muted rounded-lg flex items-center justify-center shrink-0">
      <Icon class="w-5 h-5 text-foreground/70" />
    </div>
    <div class="min-w-0">
      <p class="text-xs font-bold text-foreground">Action Label</p>
      <p class="text-[11px] text-muted-foreground truncate">Detail text</p>
    </div>
  </a>
</div>
```

**Info Card with Table:**
```html
<Card>
  <CardHeader class="pb-0">
    <CardTitle class="text-sm font-bold flex items-center gap-2">
      <Icon class="w-4 h-4 text-muted-foreground" /> Details
    </CardTitle>
  </CardHeader>
  <CardContent class="pt-4">
    <div class="bg-muted/30 p-4 rounded-lg border border-border/50 mb-4">
      <p class="text-foreground/90 text-sm leading-relaxed">{description}</p>
    </div>
    <Table>
      <TableBody>
        <TableRow>
          <TableCell class="text-muted-foreground text-xs font-medium w-32 pl-0">
            <span class="flex items-center gap-2"><Icon class="w-3.5 h-3.5" /> Label</span>
          </TableCell>
          <TableCell class="text-sm font-semibold">Value</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </CardContent>
</Card>
```

**Status-dependent Action Cards:**

*Pending/Assigned:*
```html
<Card>
  <CardHeader class="text-center pb-2">
    <CardTitle class="text-lg font-bold">Action Title</CardTitle>
    <p class="text-sm text-muted-foreground">Instructions.</p>
  </CardHeader>
  <CardContent><!-- Form --></CardContent>
</Card>
```

*In Progress:*
```html
<Card class="border-primary/30">
  <CardHeader class="text-center pb-2">
    <div class="flex items-center justify-center gap-2 mb-2">
      <span class="relative flex h-2 w-2">
        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75"></span>
        <span class="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
      </span>
      <span class="text-amber-500 text-xs font-bold uppercase tracking-widest">In Progress</span>
    </div>
  </CardHeader>
</Card>
```

*Completed:*
```html
<Card class="border-emerald-500/30 bg-emerald-500/5">
  <CardContent class="py-8 text-center">
    <div class="w-14 h-14 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
      <CheckCircle class="w-7 h-7 text-emerald-500" />
    </div>
    <p class="text-lg font-bold text-foreground">Completed</p>
    <p class="text-sm text-muted-foreground mt-1">Timestamp</p>
  </CardContent>
</Card>
```

---

## 5. Status Color System

Create a shared utility (`lib/status-colors.ts`) with this pattern:

```typescript
interface StatusStyle {
  bg: string;
  text: string;
  border: string;
  dot: string;
}

const STATUS_MAP: Record<string, StatusStyle> = {
  PENDING:     { bg: "bg-slate-500/10",   text: "text-slate-500",   border: "border-slate-500/30",   dot: "bg-slate-400" },
  NEW:         { bg: "bg-slate-500/10",   text: "text-slate-500",   border: "border-slate-500/30",   dot: "bg-slate-400" },
  BOOKED:      { bg: "bg-violet-500/10",  text: "text-violet-500",  border: "border-violet-500/30",  dot: "bg-violet-400" },
  QUOTED:      { bg: "bg-indigo-500/10",  text: "text-indigo-500",  border: "border-indigo-500/30",  dot: "bg-indigo-400" },
  APPROVED:    { bg: "bg-cyan-500/10",    text: "text-cyan-500",    border: "border-cyan-500/30",    dot: "bg-cyan-400" },
  ASSIGNED:    { bg: "bg-blue-500/10",    text: "text-blue-500",    border: "border-blue-500/30",    dot: "bg-blue-400" },
  IN_PROGRESS: { bg: "bg-amber-500/10",   text: "text-amber-500",   border: "border-amber-500/30",   dot: "bg-amber-400" },
  RESOLVED:    { bg: "bg-emerald-500/10", text: "text-emerald-500", border: "border-emerald-500/30", dot: "bg-emerald-400" },
  COMPLETED:   { bg: "bg-emerald-500/10", text: "text-emerald-500", border: "border-emerald-500/30", dot: "bg-emerald-400" },
  INVOICED:    { bg: "bg-orange-500/10",  text: "text-orange-500",  border: "border-orange-500/30",  dot: "bg-orange-400" },
  PAID:        { bg: "bg-green-500/10",   text: "text-green-500",   border: "border-green-500/30",   dot: "bg-green-400" },
};
```

**Badge usage:**
```
text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${statusBadgeClasses(status)}
```

**Label function:** Replaces underscores with spaces, title-cases.

---

## 6. Typography Scale

| Element | Classes |
|---------|---------|
| Page title | `text-2xl font-extrabold text-foreground tracking-tight` |
| Page subtitle | `text-muted-foreground text-sm mt-1` |
| Card title | `text-base font-bold` or `text-sm font-bold` |
| Stat value | `text-2xl font-extrabold text-foreground tabular-nums` |
| Stat label | `text-xs text-muted-foreground font-medium` |
| Section label (sidebar) | `text-[10px] font-bold uppercase tracking-[0.1em] text-sidebar-foreground/40` |
| Status badge | `text-[10px] font-bold uppercase` |
| Timestamp | `text-xs text-muted-foreground whitespace-nowrap` |
| Secondary text | `text-xs text-muted-foreground` |
| Tiny label | `text-[10px] font-black uppercase tracking-widest text-muted-foreground` |
| Tiny timestamp | `text-[11px] text-muted-foreground` |
| Body text | `text-sm text-foreground/90 leading-relaxed` |
| Table header | `font-medium text-foreground` (inherited from TableHead) |
| Table cell primary | `font-semibold text-foreground text-sm` |
| Table cell secondary | `text-xs text-muted-foreground line-clamp-1` |

---

## 7. Spacing Conventions

| Context | Value |
|---------|-------|
| Page wrapper | `space-y-8 pb-12` (dashboard) or `space-y-6 pb-12` (detail/list) |
| Main content padding | `p-4 lg:px-6 lg:py-8` |
| Card padding | `p-6` (default) or `p-5` (stat cards) |
| Card header to content | `pt-4` on CardContent when CardHeader has `pb-0` |
| Stat card icon container | `w-11 h-11 rounded-xl` |
| Quick action icon | `w-10 h-10 rounded-lg` |
| Grid gaps | `gap-3` (tight), `gap-4` (default), `gap-6` (spacious sections) |
| Mobile card spacing | `space-y-3` |
| Section gap (sidebar) | `mt-8` between sections, `space-y-1` between items |
| Header height | `h-16` (both header and sidebar header) |

---

## 8. Responsive Patterns

| Breakpoint | Usage |
|------------|-------|
| Default (mobile) | Single column, card-based layouts, `p-4` padding |
| `sm:` (640px) | Minor layout adjustments, inline buttons |
| `md:` (768px) | **Table/card swap point** — `hidden md:block` for tables, `md:hidden` for cards |
| `lg:` (1024px) | **Sidebar visible** — `hidden lg:flex`, multi-column grids |
| `min-[1100px]:` | Date display in header becomes visible |

**Grid scaling:**
- Mobile: `grid-cols-1` or `grid-cols-2`
- Desktop: `lg:grid-cols-3` or `lg:grid-cols-4`
- Dashboard content: `lg:grid-cols-3` with card spanning `col-span-2` for main content

**Every data table MUST have a mobile card equivalent.** Desktop tables use `hidden md:block`, mobile cards use `md:hidden`.

---

## 9. Animations & Transitions

| Element | Animation |
|---------|-----------|
| Page entry | `animate-in fade-in slide-in-from-bottom-4 duration-500` |
| Loading skeleton | `animate-in fade-in duration-300` |
| Sidebar collapse | `transition-all duration-300 ease-in-out` |
| Hover states | `transition-colors` or `transition-all` |
| Back button arrow | `transition-transform group-hover:-translate-x-1` |
| Button press | `active:translate-y-px` (via shadcn Button) |
| Notification dot | `animate-pulse` with `border-2 border-background` |
| In-progress indicator | Dual-span ping: outer `animate-ping opacity-75`, inner static |
| Loading spinner | `border-2 border-primary/20 border-t-primary rounded-full animate-spin shadow-sm` |
| Card hover | `hover:border-primary/30 transition-colors` |

---

## 10. Loading States

**Skeleton pattern for dashboards:**
```html
<div class="space-y-8 animate-in fade-in duration-300">
  <!-- Header skeleton -->
  <div class="space-y-2">
    <Skeleton class="h-10 w-56 rounded-lg" />
    <Skeleton class="h-4 w-40 rounded-md" />
  </div>
  <!-- Stat cards skeleton -->
  <div class="grid grid-cols-2 gap-4">
    <Skeleton class="h-32 rounded-xl" />
    <Skeleton class="h-32 rounded-xl" />
  </div>
  <!-- Content skeleton -->
  <Skeleton class="h-40 rounded-xl" />
  <Skeleton class="h-40 rounded-xl" />
</div>
```

**Session hydration spinner:**
```html
<div class="min-h-screen flex items-center justify-center bg-background">
  <div class="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin shadow-sm" />
</div>
```

---

## 11. Access Denied Pattern

```html
<Card class="p-12 text-center rounded-3xl animate-in fade-in duration-500">
  <ShieldCheck class="w-12 h-12 text-destructive mx-auto mb-4 opacity-50" />
  <h3 class="text-xl font-bold text-foreground">Access Denied</h3>
  <p class="text-muted-foreground mt-2">You do not have the required permissions.</p>
</Card>
```

---

## 12. Portal Config Structure

Each portal (admin, client, technician, etc.) is defined with:

```typescript
interface PortalConfig {
  portalName: string;
  portalSlug: string;          // Used for localStorage keys, route detection
  accentColor: string;         // CSS variable reference
  dashboardPath: string;
  allowedRoles: string[];
  navSections: {
    label: string;
    items: { href: string; label: string; icon: LucideIcon }[];
  }[];
  quickAction?: { label: string; href: string; icon: LucideIcon };
  websiteLink: { href: string; label: string; icon: LucideIcon };
  settingsPath: string;
}
```

Portal layout files (`app/(portal)/layout.tsx`) wrap children in `<PortalShell config={portalConfig}>`.

---

## 13. CSS Custom Properties to Define

Your `globals.css` should define these semantic tokens (values are project-specific):

```css
:root {
  --background: /* light bg */;
  --foreground: /* dark text */;
  --card: /* card bg */;
  --card-foreground: /* card text */;
  --primary: /* main accent */;
  --primary-foreground: /* text on primary */;
  --muted: /* subtle bg */;
  --muted-foreground: /* subtle text */;
  --border: /* border color */;
  --destructive: /* red/error */;
  --warning: /* amber/warning */;
  --success: /* green/success */;
  --info: /* blue/info */;
  --sidebar: /* sidebar bg */;
  --sidebar-foreground: /* sidebar text */;
  --sidebar-border: /* sidebar border */;
  --sidebar-accent: /* active nav item bg */;
  --sidebar-accent-foreground: /* active nav item text */;
  --ring: /* focus ring */;
  --radius: 0.5rem;
}

.dark {
  /* Override all above for dark mode */
}
```

### Required Custom Utilities
```css
@utility no-scrollbar {
  &::-webkit-scrollbar { display: none; }
  -ms-overflow-style: none;
  scrollbar-width: none;
}
```

---

## 14. Key Design Principles

1. **No max-width constraints** on portal pages — content fills available width
2. **Every table has a mobile card equivalent** — swap at `md:` breakpoint
3. **Consistent stat card pattern** — colored icon container + label + bold number
4. **Status badges are always** `text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border`
5. **Human-readable labels** — no jargon, no military terminology, no technical codes in UI
6. **Minimal Cards** — use shadcn `<Card>` for content grouping, not heavy decoration
7. **Page entry animations** — `animate-in fade-in slide-in-from-bottom-4 duration-500`
8. **Sidebar is the only fixed element** — header is sticky, content scrolls
9. **Glassmorphism header** — `bg-background/80 backdrop-blur-md`
10. **Subtle shadows** — `shadow-sm` on cards, no heavy box-shadows
11. **Overflow protection** — `overflow-x-hidden` on main wrappers, `min-w-0` + `shrink-0` on flex items to prevent horizontal scroll
12. **Footer is minimal** — one line, tiny text, high tracking, low opacity
