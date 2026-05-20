# Layout Recipes

Match the document to the right layout. Each recipe lists the components from
[`component-patterns.md`](./component-patterns.md) you should reach for and
the order to stack them.

---

## R1 · Status report (weekly engineering / sprint snapshot)

**When**: anything that summarises a fixed time-window of work.

**Stack**:
1. Document header — eyebrow (`Week 11 · 2026-05-20`), title (`Engineering Status`), deck
2. **KPI cards** row — 4 metrics, each with delta
3. `## Highlights` — 3–5 bullets, no tables
4. `## Shipped` — a table: PR / title / author / **status pill**
5. `## Velocity` — small bar chart (or skip) + one sentence of commentary
6. `## Carryover` — 3-column grid: In review / Blocked / Slipped
7. Footer — source attribution (`git log main..HEAD`, dashboard, deploy log)

Keep the whole page under 600 words. KPI cards do the heavy lifting; prose
only fills the gaps.

---

## R2 · Implementation plan (RFC / phased rollout)

**When**: kicking off a multi-week feature with risks worth flagging.

**Stack**:
1. Document header — eyebrow (`Implementation plan · Project`), title, deck with effort estimate + surfaces touched
2. **Metadata block** — 4-card row: effort, packages, new tables, feature flag
3. `## 01 · Milestones` — **Timeline component**, week-by-week
4. `## 02 · Data flow` — ASCII diagram or inline SVG + one paragraph of legend
5. `## 03 · Mockups` — labelled image / SVG sections
6. `## 04 · Key code` — 1–2 code blocks with file-path eyebrows
7. `## 05 · Risks & mitigations` — risk table with severity pills
8. `## 06 · Open questions` — freeform; each ends with `Decide with · X, before Y`

This is the most disciplined layout. Numbered sections are not optional —
they let the reader cite `02 · Data flow` without ambiguity.

---

## R3 · Incident report (post-mortem)

**When**: something broke; here's what happened.

**Stack**:
1. Document header — eyebrow with **SEV** classification + duration, title naming the incident
2. **Single KPI row** — duration, users impacted, revenue impact, MTTR
3. `## Timeline` — Timeline component, every line stamped to the minute
4. `## Blast radius` — table of affected systems / users / data
5. `## Contributing factors` — bullet list (not a table) — each starts with a verb
6. `## What we did right` — short bullets (rebuild morale)
7. `## Action items` — checklist with owner + due-date pill

No mockups, no code blocks unless they're the literal commands that caused
or fixed the incident.

---

## R4 · Research feature explainer

**When**: introducing a new product feature to internal staff.

**Stack**:
1. Document header — eyebrow (`Research · feature explainer`), title that's a **value-proposition sentence**, deck
2. `## Why` — one paragraph + a pull-quote
3. `## How it works` — inline SVG diagram + numbered steps
4. `## When it triggers` — table of conditions
5. `## What it changes` — before/after split (two callouts side-by-side)
6. `## Glossary` — definitions list (5–8 terms)

Use serif pull-quotes liberally. This layout is the most editorial of the
bunch.

---

## R5 · Research concept explainer

**When**: teaching an abstract idea (CRDTs, consistent hashing, RLS, etc.).

**Stack**:
1. Document header — title is a **question** (`How many keys have to move?`)
2. `## The trick` — one paragraph; usually involves a metaphor
3. `## Visualisation` — interactive SVG or animation, captioned
4. `## Versus the naive approach` — comparison table (4–6 rows)
5. `## Where you'll meet it` — bullets of real-world usage
6. `## Glossary` — terminal definitions

The visualisation is the centrepiece. If you can't build one, this layout
isn't the right fit — use R4 instead.

---

## R6 · Design system page

**When**: documenting tokens, components, or both.

**Stack**:
1. Document header — title is the system name
2. `## Tokens` — colour swatches, type scale samples, spacing dots
3. `## Components` — one section per component with: name, when-to-use blurb, every state
4. `## Patterns` — composites of multiple components (header layouts, form patterns)

Swatches must show **token name + hex** stacked. Don't use abstract names
without values.

---

## R7 · Index / table-of-contents page

**When**: landing page for a doc set.

**Stack**:
1. Document header — site or section name
2. One-paragraph orienting blurb ("read this first")
3. **Card grid** — one card per linked doc, with eyebrow / title / short blurb / meta line
4. Optional standalone HTML section at the bottom for hand-authored reports

Keep cards consistent. If one card lists a date, every card lists a date.

---

## R8 · Triage board / editor

**When**: a flat list of items that need triage — issues, PRs, requests.

**Stack**:
1. Document header — light, just title + count
2. **Filter pills row** — clickable pills above the list
3. **Item rows** — 3-column: title link / status pill / owner
4. Optional `## Recently closed` collapsed section

Don't over-engineer. The list is the page.

---

# Wiring tips for generated mirrors

If you're rendering Markdown → HTML for a doc site (like
`scripts/build-docs-html.mjs` in this repo):

1. **Match `.md` filename to layout** — `2026-MM-DD-status.md` → R1; `*-plan.md` → R2; `incident-*.md` → R3.
   For unknown docs default to R5 (concept explainer) — it's the most general.
2. **Auto-build a TOC sidebar** for any doc with 3+ `## H2` sections.
   Stick it to `position: sticky; top: 24px` and put it in a 2-col grid with the main content.
3. **Rewrite internal `.md` links to `.html`** so the rendered tree is self-contained.
4. **Light mode only.** Don't auto-flip on `prefers-color-scheme: dark` — the warm palette doesn't invert cleanly. If a project genuinely needs a dark theme, build it as a separate skin.
5. **Don't syntax-highlight code by default.** Plain monospace reads cleaner.
   If the content really benefits (long SQL blocks), wire `prismjs` or `highlight.js` selectively.
6. **Keep generated pages stateless** — every page should make sense if it's the entry point. That means each gets the nav, the eyebrow, the title.

---

# Quick chooser

| Source markdown contains… | Use recipe |
|---|---|
| "Week N", KPIs, list of shipped items | R1 status report |
| "Phase 1 / Week 1", risks, mockups | R2 implementation plan |
| "Incident", "post-mortem", "SEV-" | R3 incident report |
| Product feature with a screenshot | R4 feature explainer |
| Abstract concept needing a metaphor | R5 concept explainer |
| Colour palette, type scale, component states | R6 design system |
| Just links to other docs | R7 index |
| Long list of items to triage | R8 board |
| Anything else | R5 concept explainer (default) |