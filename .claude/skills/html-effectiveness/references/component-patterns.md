# Component Patterns

Copy-paste HTML for every component in the design system. All classes are
defined in [`design-tokens.css`](./design-tokens.css). Render with the tokens
sheet linked in `<head>` and these snippets just work.

---

## Document shell

Every page starts with this scaffold. The `he-shell` width caps the column.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Page title · Project Name</title>
  <link rel="stylesheet" href="/design-tokens.css">
</head>
<body>
  <div class="he-shell">
    <nav class="he-nav">
      <a class="he-nav__brand" href="/">Project <small>docs</small></a>
      <div class="he-nav__links">
        <a href="/index.html">Index</a>
        <a href="/architecture/system-overview.html">Architecture</a>
        <a href="/guides/setup.html">Guides</a>
        <a href="/audits/">Audits</a>
        <a href="/plans/">Plans</a>
      </div>
    </nav>

    <!-- content goes here -->

    <footer class="he-foot">
      Last updated <time datetime="2026-05-20">Mar 20 · 2026</time>
    </footer>
  </div>
</body>
</html>
```

---

## Document header

The lede block. Eyebrow (small uppercase metadata) → display title → deck (sub-line).

```html
<p class="he-eyebrow">Audits · 2026-05-20</p>
<h1 class="he-title">Comprehensive audit</h1>
<p class="he-deck">
  Every finding from the May audit cross-checked against the current codebase,
  with file:line evidence and verification log.
</p>
```

---

## Numbered section

Section dividers. Mono-uppercase numeral with `· Title` works as the header.

```html
<section class="he-section">
  <div class="he-section__num">01 · Verification</div>
  <h2 class="he-section__title">All checks green</h2>
  <p>Run on 2026-05-20 after every audit fix landed:</p>
  <!-- … -->
</section>
```

---

## KPI cards

Big number + label + delta. Use 3–5 per row max. The KPI value is the only
place you should use the monospace face at large size.

```html
<div class="he-kpis">
  <div class="he-kpi">
    <div class="he-kpi__value">102</div>
    <div class="he-kpi__label">Tests passing</div>
    <div class="he-kpi__delta">±0 vs prior session</div>
  </div>
  <div class="he-kpi">
    <div class="he-kpi__value">219</div>
    <div class="he-kpi__label">Routes built</div>
    <div class="he-kpi__delta he-kpi__delta--up">+7 new</div>
  </div>
  <div class="he-kpi">
    <div class="he-kpi__value">86s</div>
    <div class="he-kpi__label">Build time</div>
    <div class="he-kpi__delta">unchanged</div>
  </div>
  <div class="he-kpi">
    <div class="he-kpi__value">0</div>
    <div class="he-kpi__label">Type errors</div>
    <div class="he-kpi__delta">tsc --noEmit</div>
  </div>
</div>
```

---

## Status pills

For severity / state / status. **One pill per item** — not a wall of badges.

```html
<span class="he-pill he-pill--low">Low</span>
<span class="he-pill he-pill--med">Med</span>
<span class="he-pill he-pill--high">High</span>
<span class="he-pill he-pill--done">Done</span>
<span class="he-pill he-pill--blocked">Blocked</span>
<span class="he-pill he-pill--review">In review</span>
<span class="he-pill he-pill--info">Info</span>
<span class="he-pill he-pill--neutral">Deferred</span>
```

---

## Risk / finding table

Three columns: description / severity pill / mitigation. Don't be afraid of
short prose in the cells.

```html
<table>
  <thead>
    <tr>
      <th>Risk</th>
      <th>Severity</th>
      <th>Mitigation</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Plaintext password in bulk-import response</td>
      <td><span class="he-pill he-pill--high">High</span></td>
      <td>Strip <code>temporaryPassword</code> from the API response; email-only delivery</td>
    </tr>
    <tr>
      <td>YoYCharts not dynamic-imported</td>
      <td><span class="he-pill he-pill--med">Med</span></td>
      <td>Wrap in <code>next/dynamic</code>; ~200KB Recharts moves to lazy chunk</td>
    </tr>
  </tbody>
</table>
```

---

## Callout boxes

Information / warning / danger / success. Stacked border-left + tinted bg.

```html
<aside class="he-callout he-callout--info">
  <div class="he-callout__title">Why we chose this approach</div>
  Logical replication is built into Postgres and battle-tested. Dual-write
  needs distributed transactions or eventual-consistency tooling that we
  don't want to maintain.
</aside>

<aside class="he-callout he-callout--warning">
  <div class="he-callout__title">Manual step required</div>
  Cannot be executed from this environment — see the runbook for the SQL
  to run on Neon + Supabase.
</aside>

<aside class="he-callout he-callout--danger">
  <div class="he-callout__title">Do not switch adapters</div>
  Reverting to <code>@prisma/adapter-neon</code> breaks Vercel serverless
  bundles.
</aside>

<aside class="he-callout he-callout--success">
  <div class="he-callout__title">Resolved</div>
  All 11 CRITICAL findings closed. See the table below for file:line evidence.
</aside>
```

---

## Card grid (link index)

Use for indexes, table-of-contents pages, related-document lists.

```html
<div class="he-grid">
  <a class="he-card" href="./api.html">
    <div class="he-card__eyebrow">Architecture</div>
    <h3>API reference</h3>
    <p>Every staff/student/instructor endpoint, with request/response shape.</p>
    <div class="he-card__meta">
      <span>↗ 24 routes</span>
      <span>Updated 2026-05-20</span>
    </div>
  </a>
  <a class="he-card" href="./database-detail.html">
    <div class="he-card__eyebrow">Architecture</div>
    <h3>Database detail</h3>
    <p>RLS policies, soft-delete extension, dual-client pattern.</p>
  </a>
</div>
```

---

## Timeline / phased plan

For implementation plans (Week 1 / Week 2 / …) or rollout schedules.

```html
<div class="he-timeline">
  <div class="he-timeline__item">
    <div class="he-timeline__when">Week 1 · Mon–Tue</div>
    <div class="he-timeline__what">
      <h3>Schema & API contract</h3>
      <p>New <code>task_comment</code> + <code>comment_mention</code> tables; migration <code>0042_comments.sql</code>.</p>
      <p>API endpoints live under <code>/api/tasks/[id]/comments</code> with Zod validation.</p>
    </div>
  </div>
  <div class="he-timeline__item">
    <div class="he-timeline__when">Week 1 · Wed–Fri</div>
    <div class="he-timeline__what">
      <h3>Optimistic write path</h3>
      <p>Client renders the comment immediately, reconciles on server response. Failure rolls the local store back.</p>
    </div>
  </div>
</div>
```

---

## Pull-quote

For surfacing a single line worth slowing down on. Serif face by default.

```html
<blockquote class="he-pull">
  "If your audit says 'partial', it's not done — it's a follow-up. Write the
  follow-up before you close the ticket."
</blockquote>
```

---

## Glossary

Terminal definitions list. Mono-key on the left, prose definition on the right.

```html
<dl class="he-glossary">
  <dt>RLS</dt>
  <dd>Row-level security. Postgres policies that filter SELECT/UPDATE/DELETE based on session variables we set from the application.</dd>
  <dt>Soft delete</dt>
  <dd>Setting <code>deletedAt</code> instead of issuing DELETE. The Prisma extension at <code>lib/prisma/soft-delete-extension.ts</code> filters them out by default.</dd>
  <dt>Dual client</dt>
  <dd>Both <code>prisma</code> (RLS-wrapped) and <code>prismaUnfiltered</code> (raw) are exported from <code>lib/prisma/client.ts</code>. Staff pages use the raw client.</dd>
</dl>
```

---

## Inline tag

Monospace for filenames, flags, table names. Use sparingly — only for things
you'd paste into a terminal or config.

```html
The feature flag is <code>task_comments_v1</code>; the table is <code>task_comment</code>.
For background, see <code>app/api/tasks/[id]/comments/route.ts</code>.
```

---

## Code block with file path header

For long code samples. Path goes above the `pre`.

```html
<p class="he-eyebrow">app/api/tasks/[id]/comments/route.ts</p>
<pre><code>export const POST = withErrorHandler(async (req, ctx) => {
  const { id } = await ctx.params
  const body = createCommentSchema.parse(await req.json())
  // …
})</code></pre>
```

---

## ASCII data-flow

Preformatted box-and-line diagrams. Don't fight it — `<pre>` does this well.

```html
<pre>
┌──────────────┐         ┌──────────────┐
│  Task page   │ ──────▶ │  Comments    │
│  (RSC)       │         │  module      │
└──────────────┘         └──────┬───────┘
                                │
                                ▼
                         ┌──────────────┐
                         │  Optimistic  │
                         │  cache       │
                         └──────┬───────┘
                                │
                                ▼
                         ┌──────────────┐
                         │  POST /api/  │
                         │  comments    │
                         └──────────────┘
</pre>
```

---

## Carryover columns (status report)

3-column block: In review / Blocked / Slipped. Mirrors the reference
status report.

```html
<div class="he-grid" style="grid-template-columns: repeat(3, 1fr)">
  <div class="he-card">
    <div class="he-card__eyebrow">In review</div>
    <ul>
      <li>#1284 Comment threads — Priya</li>
      <li>#1287 Settings retention editor — Jordan</li>
    </ul>
  </div>
  <div class="he-card">
    <div class="he-card__eyebrow">Blocked</div>
    <ul>
      <li>Examiner availability page — waiting on Supabase RLS</li>
    </ul>
  </div>
  <div class="he-card">
    <div class="he-card__eyebrow">Slipped</div>
    <ul>
      <li>Mobile bookmarks deep-link — moved to next sprint</li>
    </ul>
  </div>
</div>
```

---

## SVG inline diagram

Use `currentColor` so it adapts to dark mode. Stroke-only beats fill for
node-and-arrow.

```html
<svg viewBox="0 0 320 80" width="100%" style="max-width: 480px; color: var(--clay)">
  <rect x="4" y="20" width="80" height="40" rx="6" fill="none" stroke="currentColor" />
  <text x="44" y="44" text-anchor="middle" font-family="var(--font-mono)" font-size="11" fill="var(--fg)">parse</text>

  <path d="M 88 40 L 116 40" stroke="currentColor" stroke-width="1.5" fill="none"
        marker-end="url(#arrow)" />

  <rect x="118" y="20" width="80" height="40" rx="6" fill="none" stroke="currentColor" />
  <text x="158" y="44" text-anchor="middle" font-family="var(--font-mono)" font-size="11" fill="var(--fg)">validate</text>

  <path d="M 202 40 L 230 40" stroke="currentColor" stroke-width="1.5" fill="none"
        marker-end="url(#arrow)" />

  <rect x="232" y="20" width="80" height="40" rx="6" fill="none" stroke="currentColor" />
  <text x="272" y="44" text-anchor="middle" font-family="var(--font-mono)" font-size="11" fill="var(--fg)">write</text>

  <defs>
    <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
    </marker>
  </defs>
</svg>
```

---

## Footer

Bottom-of-page metadata. Sources, generated-at, repo link.

```html
<footer class="he-foot">
  Generated <time datetime="2026-05-20T14:00Z">May 20 · 2026 · 14:00 UTC</time> ·
  <code>git rev-parse HEAD</code> 155a953 ·
  <a href="https://github.com/example/repo">source</a>
</footer>
```