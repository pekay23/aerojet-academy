---
name: html-effectiveness
description: "Use when producing HTML reports, dashboards, design-system pages, status updates, implementation plans, research explainers, slide decks, or any visually rich documentation. Triggers: rendering Markdown to styled HTML; building a doc site or report; designing internal tools, status reports, retros, RFCs, design-system pages, kanban-style boards, prompt tuners, feature-flag editors. Inspired by https://thariqs.github.io/html-effectiveness/."
metadata:
  author: aerojet-academy
  version: "0.1.0"
---

# HTML Effectiveness

A design system + layout cookbook for producing **visually editorial** HTML
documents from Markdown — the way [thariqs.github.io/html-effectiveness](https://thariqs.github.io/html-effectiveness/)
demonstrates. Use it when the output needs to be browsable and presentable,
not just rendered.

## Core principles

1. **Editorial, not corporate.** The reference site reads like a typeset essay,
   not a SaaS doc. Generous whitespace, restrained colour, monospace inline
   tags for filenames/flags/IDs. Default font weight for headings is **500**
   (not 700 / black). Body type is **15–16px / 1.55 line-height**.
2. **Warm neutrals beat blue tech-stack.** The palette is `clay` (#D97757),
   `slate` (#141413), `ivory` (#FAF9F5), `oat` (#E3DACC). Semantic colour
   (success/warning/danger/info) is used **sparingly** — usually one pill per
   row, not a wall of badges.
3. **Numbered sections + monospace tags.** Section headers are `01 · Title`,
   `02 · Title`, etc. File paths, table names, feature flags, schema columns
   all wrap in `<code>` inline.
4. **Show the structure.** Tables with risk pills, ASCII data-flow diagrams,
   KPI cards with delta-vs-last-week, sidebars with TOC. Don't hide
   information in prose paragraphs when a table or grid would compress it.
5. **Light mode only.** The editorial palette (clay + ivory + oat) loses its
   character when inverted; don't auto-flip on `prefers-color-scheme: dark`.
   If a project genuinely needs a dark theme, design it as a separate skin.
6. **One canonical width.** Content column is **~800–960px max** centred.
   Sidebars or wide tables can break out, but the prose stays in the column.

## Layout taxonomy

Pick the recipe that matches what you're producing. Each maps to a reference
page on the inspiration site.

| Layout | Use when | Reference |
|---|---|---|
| **Design system** | Documenting tokens, components, type/spacing scales | `05-design-system.html` |
| **Component variants** | Showing every state of a UI element (loading, hover, error, etc.) | `06-component-variants.html` |
| **Implementation plan** | Phased rollout of a feature; risks; mockups; SQL | `16-implementation-plan.html` |
| **Status report** | Weekly engineering snapshot, KPIs, shipped/blocked/carryover | `11-status-report.html` |
| **Incident report** | Post-mortem: timeline, blast radius, contributing factors, action items | `12-incident-report.html` |
| **Research feature explainer** | Pedagogical walkthrough of a new feature with interactive demo | `14-research-feature-explainer.html` |
| **Research concept explainer** | Pedagogical walkthrough of an abstract idea (consistent hashing, CRDTs, etc.) | `15-research-concept-explainer.html` |
| **Flowchart / diagram** | One concept rendered as nodes and arrows | `13-flowchart-diagram.html` |
| **SVG illustration** | Hero figures, marginalia, isotype | `10-svg-illustrations.html` |
| **Slide deck** | A pitch or readout broken into discrete slides | `09-slide-deck.html` |
| **Prototype (animation/interaction)** | Demonstrating a motion design or interaction pattern | `07-prototype-animation.html`, `08-prototype-interaction.html` |
| **Editor: triage board** | Kanban for issues / PRs / requests | `18-editor-triage-board.html` |
| **Editor: feature flags** | Live toggles for flags + cohorts | `19-editor-feature-flags.html` |
| **Editor: prompt tuner** | Side-by-side prompt + output comparison | `20-editor-prompt-tuner.html` |
| **Code exploration** | Comparing two implementation approaches side-by-side | `01-exploration-code-approaches.html` |

If the document fits none of these — default to the **research concept explainer**
layout (centred prose column, sidebar TOC, pull-quotes, glossary at the end).
It's the most general-purpose.

## Component vocabulary

The full component reference with copy-paste HTML is in
[`references/component-patterns.md`](./references/component-patterns.md). At a
glance:

- **KPI card** — big number, label, tiny delta caption underneath
- **Status pill** — `Low` / `Med` / `High` / `Done` / `Blocked` rounded pills
- **Numbered section** — `01 · Section title` headers
- **Inline tag** — monospace `<code>` for files, flags, table names
- **Risk table** — 3-column: description / severity pill / mitigation
- **Carryover block** — `In review` / `Blocked` / `Slipped` columns with owners
- **Timeline** — Week 1 / Week 2 / Week 3 blocks with sub-tasks
- **ASCII data-flow** — preformatted box-and-line diagrams in monospace
- **Glossary** — terminal `dl` of terms, definitions
- **Pull-quote** — `border-left` callout with muted background
- **Footnote** — superscript link to terminal note section
- **Code block** — monospace, restrained background, file path as header
- **SVG diagram** — inline `<svg>` with `currentColor` strokes so it respects dark mode

## Design tokens

Single source of truth in [`references/design-tokens.css`](./references/design-tokens.css).
Drop this into the `<head>` of any HTML you generate or copy the variables into
your stylesheet.

```
--clay: #D97757    /* warm accent, used sparingly for emphasis */
--slate: #141413   /* near-black, body text in light mode */
--ivory: #FAF9F5   /* near-white, page background in light mode */
--oat: #E3DACC     /* mid neutral, borders + cards */

--success: #788C5D   --warning: #C78E3F   --danger: #B04A4A   --info: #5C7CA3

/* Type scale */
--t-display: 48px / 500 / 1.1
--t-h1: 32px / 500 / 1.2
--t-h2: 24px / 500 / 1.3
--t-body: 16px / 430 / 1.55
--t-small: 14px / 430 / 1.5
--t-caption: 12px / 500 / 1.4

/* Spacing scale */
--sp-1..8: 4 8 12 16 24 32 48 64 px

/* Radius + shadow */
--r-xs..lg: 4 8 12 20 px
--shadow-sm/md/lg: subtle, layered
```

## How to apply this skill

1. **Identify the layout** — look at the source material and match it to one
   row in the taxonomy table above. If a markdown doc is a phased plan, use
   the implementation-plan layout; if it's a retro, use incident-report; etc.
2. **Start from the template** — copy
   [`assets/template.html`](./assets/template.html) and the design-tokens CSS.
3. **Use the component vocabulary** — don't invent new patterns; reach for the
   KPI card / status pill / risk table from
   [`references/component-patterns.md`](./references/component-patterns.md).
4. **Strip ornamentation, leave structure.** No emoji bullets, no full-bleed
   gradients, no SaaS-y rounded buttons. The page should feel like a
   well-typeset technical memo.
5. **For generated mirrors of Markdown** (e.g. a `docs/html/` site), read
   [`references/layout-recipes.md`](./references/layout-recipes.md) for
   how to wire the build script — heading anchors, TOC sidebars, dark mode,
   link rewriting.

## Anti-patterns

- **Don't** use saturated tech-stack blues + pure-white backgrounds. The look
  becomes generic dashboard, not editorial.
- **Don't** use heavy heading weights (700/800/900). 500 is the target.
- **Don't** put every metric in a coloured pill. Pills are for **status**, not
  decoration. One or two per card is plenty.
- **Don't** centre-align body text. Left-align everything except KPI numbers.
- **Don't** wrap normal nouns in `<code>`. Reserve monospace for things you'd
  paste into a terminal or a config file.

## When NOT to use this skill

- Marketing pages, landing pages, public-facing campaigns — those need their
  own design language (likely brighter, more imagery).
- Pure SwiftUI / React Native components — this is HTML/CSS only.
- Email templates — the colour palette and CSS support model are different
  enough that the components won't translate.
- Anything where the user has provided a different design system to follow.

## File layout in this skill

```
.claude/skills/html-effectiveness/
├── SKILL.md                          (this file — read first)
├── references/
│   ├── design-tokens.css             (drop-in CSS variables + base type)
│   ├── component-patterns.md         (copy-paste HTML for every component)
│   └── layout-recipes.md             (when to use each layout + wiring tips)
└── assets/
    └── template.html                 (minimal starter — head, nav, footer)
```
