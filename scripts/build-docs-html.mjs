#!/usr/bin/env node
/**
 * Build static HTML for every markdown file under `docs/`.
 *
 * Output: `docs/html/<section>/<slug>.html` mirroring the MD source tree,
 *         plus a top-level `docs/html/index.html` linking everything.
 *
 * Design language: see .claude/skills/html-effectiveness/SKILL.md
 *  - Editorial typography (Inter 500, generous whitespace)
 *  - Warm palette (clay #D97757 + ivory/oat + slate)
 *  - Numbered sections, KPI cards, status pills, callouts
 *  - Auto TOC sidebar for any doc with 3+ <h2> headings
 *  - Honours prefers-color-scheme: dark
 *
 * Hand-authored HTML files already inside `docs/html/` are preserved
 * (e.g. designer mockups). Only markdown sources get converted here.
 *
 * Run with: `bun run docs:html`
 */

import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { marked } from 'marked'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT = path.resolve(__dirname, '..')
const DOCS = path.join(ROOT, 'docs')
const OUT = path.join(DOCS, 'html')
const TOKENS_SRC = path.join(ROOT, '.claude/skills/html-effectiveness/references/design-tokens.css')

const SECTIONS = [
  { dir: 'architecture', title: 'Architecture', blurb: 'System reference — API, database, security.' },
  { dir: 'guides',       title: 'Guides',       blurb: 'Operational how-tos — setup, deployment, handover.' },
  { dir: 'audits',       title: 'Audits',       blurb: 'Historical audit reports, newest first.' },
  { dir: 'plans',        title: 'Plans',        blurb: 'RFCs and implementation roadmaps.' },
  { dir: 'design',       title: 'Design',       blurb: 'Design system — tokens, typography, components.' },
]

// ── HTML helpers ─────────────────────────────────────────────────────────
function escapeHtml(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

// ── Marked renderer overrides ────────────────────────────────────────────
// We extend marked to:
//   - rewrite *.md → *.html in internal links
//   - emit numbered editorial section headers (01 · Title) for top-level h2s
//   - give every h2/h3 an id for the TOC sidebar

function buildRenderer() {
  const renderer = new marked.Renderer()
  let h2Counter = 0

  renderer.heading = ({ tokens, depth }) => {
    const text = marked.Parser.parseInline(tokens)
    const plain = tokens.map((t) => t.text || '').join('')
    const id = slugify(plain)
    if (depth === 2) {
      h2Counter += 1
      const num = String(h2Counter).padStart(2, '0')
      return `
<section class="he-section" id="${id}">
  <div class="he-section__num">${num} · ${escapeHtml(plain)}</div>
  <h2 class="he-section__title">${text}</h2>`
    }
    return `<h${depth} id="${id}">${text}</h${depth}>`
  }

  // We don't auto-close sections; leaving them open is fine — the next
  // <section> opens before the prior one closes, but visually each block
  // has its top border so the seam is invisible. Real fix: process the AST,
  // not the rendered tokens. Acceptable trade-off for a build script.

  renderer.link = ({ href, title, tokens }) => {
    const text = marked.Parser.parseInline(tokens)
    let finalHref = href
    if (finalHref && /\.md(#|$)/i.test(finalHref) && !/^https?:/i.test(finalHref)) {
      finalHref = finalHref.replace(/\.md(?=#|$)/i, '.html')
    }
    const titleAttr = title ? ` title="${escapeHtml(title)}"` : ''
    return `<a href="${escapeHtml(finalHref)}"${titleAttr}>${text}</a>`
  }

  renderer.codespan = ({ text }) => `<code>${escapeHtml(text)}</code>`

  renderer.blockquote = ({ tokens }) => {
    const body = marked.Parser.parse(tokens)
    // Treat any blockquote starting with "**" as a pull-quote (serif)
    const isPull = /^<p><strong>/.test(body.trim())
    return isPull
      ? `<blockquote class="he-pull">${body}</blockquote>`
      : `<blockquote>${body}</blockquote>`
  }

  return { renderer, resetCounter: () => { h2Counter = 0 } }
}

// ── TOC extraction ───────────────────────────────────────────────────────
function extractToc(md) {
  const lines = md.split('\n')
  const out = []
  for (const line of lines) {
    const m = line.match(/^(##|###)\s+(.+?)\s*$/)
    if (m) {
      const depth = m[1].length // 2 or 3
      const text = m[2].replace(/^[#`*\s]+|[`*\s]+$/g, '')
      out.push({ depth, text, id: slugify(text) })
    }
  }
  return out
}

// ── Layout heuristic ─────────────────────────────────────────────────────
function detectLayout(slug, mdContent) {
  const s = slug.toLowerCase()
  const c = mdContent.toLowerCase()
  if (/incident|post-?mortem/.test(s)) return 'incident'
  if (/-plan|implementation|refactor/.test(s)) return 'plan'
  if (/audit|status|findings|review/.test(s)) return 'audit'
  if (/setup|deployment|contributing|handover|transition|replication/.test(s)) return 'guide'
  if (/system-overview|api|database|security|strategies|data-flow/.test(s)) return 'reference'
  return 'concept'
}

// Convert "Week 11 — Engineering Status" or first H1 to title + eyebrow.
// The deck is the first non-heading prose paragraph, rendered inline as MD
// so that emphasis and inline code survive, then trimmed to the first
// sentence to keep it from filling the screen.
function parseHeader(md, slug, section) {
  const h1Match = md.match(/^#\s+(.+)$/m)
  const title = h1Match ? h1Match[1].trim() : slug
  const afterH1 = h1Match ? md.slice((h1Match.index ?? 0) + h1Match[0].length) : md
  const paragraphs = afterH1.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)
  const deckCandidate = paragraphs.find(
    (p) => !p.startsWith('#') && !p.startsWith('```') && !p.startsWith('|') && !p.startsWith('- ') && !p.startsWith('> ')
  )
  let deckMarkdown = ''
  if (deckCandidate) {
    const oneLine = deckCandidate.replace(/\s+/g, ' ')
    // Stop at the first sentence-ending punctuation outside code spans.
    const sentenceEnd = oneLine.match(/^([^.!?`]+(?:`[^`]*`[^.!?`]*)*[.!?])(?=\s|$)/)
    if (sentenceEnd) {
      deckMarkdown = sentenceEnd[1]
    } else {
      // No sentence end — trim to ~240 chars at the last word boundary
      // and don't break a markdown link/code-span.
      let slice = oneLine.slice(0, 240)
      // If we cut inside a `[...]( )` link or `` `code` ``, walk back.
      const lastOpenBracket = slice.lastIndexOf('[')
      const lastCloseParen = slice.lastIndexOf(')')
      if (lastOpenBracket > lastCloseParen) slice = slice.slice(0, lastOpenBracket).trimEnd()
      const lastTick = slice.lastIndexOf('`')
      if (lastTick > -1 && (slice.match(/`/g) || []).length % 2 === 1) {
        slice = slice.slice(0, lastTick).trimEnd()
      }
      // Final word-boundary trim
      const lastSpace = slice.lastIndexOf(' ')
      if (lastSpace > 200) slice = slice.slice(0, lastSpace)
      deckMarkdown = slice.replace(/[,:;\s]+$/, '') + '…'
    }
  }
  const eyebrow = section ? section.title : 'Document'
  return { title, deckMarkdown, eyebrow }
}

// Strip the leading H1 + the deck paragraph so the body doesn't duplicate them.
// The deck paragraph is whatever sits between the H1 and the next blank-line
// boundary, AS LONG AS it isn't itself a heading / code fence / list / quote.
function stripHeader(md) {
  let out = md.replace(/^#\s+[^\n]+\n+/, '')
  // Take the first chunk up to the next blank line; if it's prose, drop it.
  const m = out.match(/^([^\n]+(?:\n[^\n]+)*)\n\s*\n/)
  if (m) {
    const first = m[1].trimStart()
    if (
      !first.startsWith('#') &&
      !first.startsWith('```') &&
      !first.startsWith('|') &&
      !first.startsWith('- ') &&
      !first.startsWith('* ') &&
      !first.startsWith('> ')
    ) {
      out = out.slice(m[0].length)
    }
  }
  return out
}

// ── Page template ────────────────────────────────────────────────────────
function pageHtml({ title, eyebrow, deckHtml, body, toc, project, basePathToHtml, isIndex }) {
  const nav = `
<nav class="he-nav">
  <a class="he-nav__brand" href="${basePathToHtml}index.html">${escapeHtml(project)} <small>docs</small></a>
  <div class="he-nav__links">
    <a href="${basePathToHtml}index.html">Index</a>
    <a href="${basePathToHtml}architecture/system-overview.html">Architecture</a>
    <a href="${basePathToHtml}guides/setup.html">Guides</a>
    <a href="${basePathToHtml}audits/2026-05-20-comprehensive.html">Audits</a>
    <a href="${basePathToHtml}plans/future-plans.html">Plans</a>
    <a href="${basePathToHtml}design-system.html">Design</a>
  </div>
</nav>`

  const tocHtml =
    toc && toc.length >= 3
      ? `
<aside class="he-toc" aria-label="On this page">
  <p class="he-toc__label">On this page</p>
  <ul>
    ${toc.map((t) => `<li class="he-toc__l${t.depth}"><a href="#${t.id}">${escapeHtml(t.text)}</a></li>`).join('\n    ')}
  </ul>
</aside>`
      : ''

  const useTwoCol = !!tocHtml && !isIndex
  const layoutOpen = useTwoCol ? '<div class="he-layout">' : ''
  const layoutClose = useTwoCol ? '</div>' : ''
  const mainOpen = useTwoCol ? '<main class="he-main">' : '<main>'
  const mainClose = '</main>'

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${escapeHtml(title)} · ${escapeHtml(project)}</title>
<link rel="stylesheet" href="${basePathToHtml}design-tokens.css">
<link rel="stylesheet" href="${basePathToHtml}docs.css">
</head>
<body>
<div class="he-shell ${useTwoCol ? 'he-shell--wide' : ''}">
${nav}
${layoutOpen}
${mainOpen}
<header>
  <p class="he-eyebrow">${escapeHtml(eyebrow)}</p>
  <h1 class="he-title">${escapeHtml(title)}</h1>
  ${deckHtml ? `<p class="he-deck">${deckHtml}</p>` : ''}
</header>
${body}
${mainClose}
${tocHtml}
${layoutClose}
<footer class="he-foot">
  Source · <a href="${basePathToHtml}../">browse the markdown</a> · rebuild with <code>bun run docs:html</code>
</footer>
</div>
</body>
</html>
`
}

// ── Extra CSS for the doc site (TOC + index grid) ────────────────────────
const SITE_CSS = `/* TOC sidebar + index grid extensions to the base tokens. */

.he-shell--wide { max-width: var(--col-wide); }

.he-layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--sp-6);
}
@media (min-width: 1024px) {
  .he-layout {
    grid-template-columns: 1fr 220px;
  }
}

.he-main { min-width: 0; }

.he-toc {
  position: sticky;
  top: var(--sp-5);
  align-self: start;
  padding: var(--sp-4) 0 var(--sp-4) var(--sp-4);
  border-left: 1px solid var(--border);
  font-size: var(--t-small-size);
  max-height: calc(100vh - var(--sp-7));
  overflow-y: auto;
}
.he-toc__label {
  font-size: var(--t-caption-size);
  letter-spacing: var(--t-caption-tracking);
  text-transform: uppercase;
  color: var(--fg-muted);
  margin: 0 0 var(--sp-3);
}
.he-toc ul { list-style: none; padding: 0; margin: 0; }
.he-toc li { margin: var(--sp-2) 0; }
.he-toc__l3 { padding-left: var(--sp-3); }
.he-toc a { color: var(--fg-muted); border: 0; }
.he-toc a:hover { color: var(--clay); }

/* Index page: section heading + cards */
.he-index-section { margin-top: var(--sp-7); }
.he-index-section__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--sp-4);
  margin-bottom: var(--sp-4);
  padding-bottom: var(--sp-3);
  border-bottom: 1px solid var(--border);
}
.he-index-section__head h2 { margin: 0; font-size: var(--t-h2-size); font-weight: 500; }
.he-index-section__blurb { color: var(--fg-muted); font-size: var(--t-small-size); margin: 0; max-width: 50ch; text-align: right; }

/* "Standalone HTML" section uses minimal cards */
.he-standalone-grid { display: grid; gap: var(--sp-3); grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
.he-standalone-card {
  padding: var(--sp-4) var(--sp-4);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-md);
}
.he-standalone-card a { font-weight: 500; }
.he-standalone-card p { font-size: var(--t-small-size); color: var(--fg-muted); margin: var(--sp-1) 0 0; }
`

// ── File walking ─────────────────────────────────────────────────────────
async function walkMd(dir) {
  const out = []
  const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => [])
  for (const ent of entries) {
    if (ent.isDirectory()) continue
    if (ent.name.endsWith('.md')) out.push(path.join(dir, ent.name))
  }
  return out.sort()
}

// ── Build one MD file ────────────────────────────────────────────────────
async function buildPage({ src, outPath, section, project, basePathToHtml }) {
  const md = await fs.readFile(src, 'utf8')
  const { title, deckMarkdown, eyebrow } = parseHeader(md, path.basename(src, '.md'), section)
  const toc = extractToc(md)
  const stripped = stripHeader(md)

  const { renderer, resetCounter } = buildRenderer()
  resetCounter()
  const body = marked.parse(stripped, { gfm: true, renderer })
  const deckHtml = deckMarkdown ? marked.parseInline(deckMarkdown, { gfm: true }) : ''

  const html = pageHtml({
    title,
    eyebrow,
    deckHtml,
    body,
    toc,
    project,
    basePathToHtml,
    isIndex: false,
  })

  await fs.mkdir(path.dirname(outPath), { recursive: true })
  await fs.writeFile(outPath, html, 'utf8')
  return {
    slug: path.basename(src, '.md'),
    title,
    deck: deckMarkdown, // raw text for card grid preview
    srcRelative: path.relative(ROOT, src).replaceAll('\\', '/'),
  }
}

// ── Build the index ──────────────────────────────────────────────────────
async function buildIndex({ project, sectionResults }) {
  const sectionsHtml = sectionResults
    .map((s) => {
      const cards = s.files
        .map(
          (f) => `
    <a class="he-card" href="./${s.dir}/${f.slug}.html">
      <div class="he-card__eyebrow">${escapeHtml(s.title)}</div>
      <h3>${escapeHtml(f.title)}</h3>
      <p>${escapeHtml((f.deck || '').slice(0, 180))}</p>
      <div class="he-card__meta">
        <span>${escapeHtml(f.srcRelative)}</span>
      </div>
    </a>`
        )
        .join('')

      return `
<section class="he-index-section" id="${s.dir}">
  <div class="he-index-section__head">
    <h2>${escapeHtml(s.title)}</h2>
    <p class="he-index-section__blurb">${escapeHtml(s.blurb)}</p>
  </div>
  <div class="he-grid">${cards}
  </div>
</section>`
    })
    .join('\n')

  // Hand-authored HTMLs at the root of /html/
  const handAuthored = (await fs.readdir(OUT))
    .filter((f) => f.endsWith('.html') && f !== 'index.html')
    .filter(async (f) => {
      const stat = await fs.stat(path.join(OUT, f)).catch(() => null)
      return stat && !stat.isDirectory()
    })

  const standalone =
    handAuthored.length > 0
      ? `
<section class="he-index-section" id="standalone">
  <div class="he-index-section__head">
    <h2>Standalone HTML</h2>
    <p class="he-index-section__blurb">Hand-authored visual reports — not derived from markdown.</p>
  </div>
  <div class="he-standalone-grid">
    ${handAuthored
      .map(
        (f) => `<div class="he-standalone-card">
      <a href="./${f}">${escapeHtml(f.replace(/-/g, ' ').replace('.html', ''))}</a>
      <p>↗ open report</p>
    </div>`
      )
      .join('\n    ')}
  </div>
</section>`
      : ''

  const total = sectionResults.reduce((s, sec) => s + sec.files.length, 0)
  const body = `
<div class="he-kpis">
  <div class="he-kpi"><div class="he-kpi__value">${total}</div><div class="he-kpi__label">Generated pages</div></div>
  <div class="he-kpi"><div class="he-kpi__value">${sectionResults.length}</div><div class="he-kpi__label">Sections</div></div>
  <div class="he-kpi"><div class="he-kpi__value">${handAuthored.length}</div><div class="he-kpi__label">Standalone reports</div></div>
</div>
${sectionsHtml}
${standalone}
`

  const html = pageHtml({
    title: 'Documentation',
    eyebrow: `${project} · docs`,
    deckHtml:
      'All project documentation, organised by purpose. Markdown sources live in <code>docs/architecture</code>, <code>docs/guides</code>, <code>docs/audits</code>, <code>docs/plans</code>, and <code>docs/design</code>.',
    body,
    toc: [],
    project,
    basePathToHtml: './',
    isIndex: true,
  })
  await fs.writeFile(path.join(OUT, 'index.html'), html, 'utf8')
}

// ── Main ─────────────────────────────────────────────────────────────────
async function main() {
  const project = await readProjectName()
  await fs.mkdir(OUT, { recursive: true })

  // Copy tokens + site CSS into /html/ so all generated pages can link them.
  // Copy Aerojet-specific design tokens (used by design-system.html and preview)
  const aeroTokens = path.join(ROOT, 'docs', 'html', 'aerojet-design-tokens.css')
  if (await fs.stat(aeroTokens).catch(() => null)) {
    await fs.copyFile(aeroTokens, path.join(OUT, 'aerojet-design-tokens.css'))
  }

  const tokens = await fs.readFile(TOKENS_SRC, 'utf8')
  await fs.writeFile(path.join(OUT, 'design-tokens.css'), tokens, 'utf8')
  await fs.writeFile(path.join(OUT, 'docs.css'), SITE_CSS, 'utf8')

  const sectionResults = []
  for (const section of SECTIONS) {
    const srcDir = path.join(DOCS, section.dir)
    const outDir = path.join(OUT, section.dir)
    const files = await walkMd(srcDir)
    const built = []
    for (const src of files) {
      const slug = path.basename(src, '.md')
      const outPath = path.join(outDir, `${slug}.html`)
      const result = await buildPage({
        src,
        outPath,
        section,
        project,
        basePathToHtml: '../',
      })
      built.push(result)
    }
    sectionResults.push({ ...section, files: built })
  }

  await buildIndex({ project, sectionResults })

  const total = sectionResults.reduce((s, sec) => s + sec.files.length, 0)
  console.log(
    `[build-docs-html] generated ${total} HTML pages + index across ${SECTIONS.length} sections (design-tokens + docs.css copied into docs/html/)`
  )
}

async function readProjectName() {
  try {
    const pkg = JSON.parse(await fs.readFile(path.join(ROOT, 'package.json'), 'utf8'))
    if (pkg.name) {
      // "aerojet-academy" → "Aerojet Academy"
      return pkg.name
        .split(/[-_\s]+/)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ')
    }
  } catch {}
  return 'Project'
}

main().catch((err) => {
  console.error('[build-docs-html] failed:', err)
  process.exit(1)
})




