#!/usr/bin/env node
/**
 * Convert restored HTML files back to markdown source files.
 * Run with: bun scripts/html-to-md.mjs
 */

import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT = path.resolve(__dirname, '..')
const HTML_ROOT = path.join(ROOT, 'docs', 'html')
const MD_ROOT = path.join(ROOT, 'docs')

// HTML to Markdown conversion
function htmlToMd(html) {
  let md = html

  // Remove DOCTYPE and html/head/body wrapper
  md = md.replace(/<!DOCTYPE html>[\s\S]*?<body[^>]*>/, '')
  md = md.replace(/<\/body>[\s\S]*$/, '')

  // Remove nav, layout divs, footer
  md = md.replace(/<nav class="he-nav">[\s\S]*?<\/nav>\s*/, '')
  md = md.replace(/<div class="he-layout">\s*/, '')
  md = md.replace(/<main class="he-main">\s*/, '')
  md = md.replace(/<\/main>\s*/, '')
  md = md.replace(/<\/div>\s*<aside class="he-toc">[\s\S]*?<\/aside>\s*/, '')
  md = md.replace(/<footer class="he-foot">[\s\S]*?<\/footer>\s*/, '')
  md = md.replace(/<div class="he-shell[^"]*">\s*/, '')
  md = md.replace(/<\/div>\s*$/, '')

  // Convert headers
  md = md.replace(/<header>\s*/, '')
  md = md.replace(/<\/header>\s*/, '\n')
  md = md.replace(/<hr \/>/g, '---\n')
  md = md.replace(/<hr>/g, '---\n')

  // h1 - keep as title heading
  md = md.replace(/<h1 class="he-title">(.*?)<\/h1>/g, '# $1\n')

  // Remove hr after header/deck
  md = md.replace(/^---+\s*/, '')

  // h2 with section wrapper
  md = md.replace(/<section class="he-section" id="([^"]*)"><div class="he-section__num">([^<]*)<\/div><h2 class="he-section__title">(.*?)<\/h2><\/section>/g, '## $2\n')
  // h2 without section
  md = md.replace(/<h2[^>]*>(.*?)<\/h2>/g, '## $1\n')
  // h3
  md = md.replace(/<h3 id="([^"]*)">(.*?)<\/h3>/g, '### $2\n')
  md = md.replace(/<h3[^>]*>(.*?)<\/h3>/g, '### $1\n')

  // p
  md = md.replace(/<p class="he-deck">[\s\S]*?<\/p>/g, '')  // Remove deck - will be extracted from first paragraph
  md = md.replace(/<p class="he-eyebrow">(.*?)<\/p>/g, '')
  md = md.replace(/<p>(.*?)<\/p>/g, '$1\n\n')

  // strong
  md = md.replace(/<strong>(.*?)<\/strong>/g, '**$1**')
  // em
  md = md.replace(/<em>(.*?)<\/em>/g, '*$1*')
  // code inline
  md = md.replace(/<code>(.*?)<\/code>/g, '`$1`')
  md = md.replace(/<pre><code class="language-([^"]*)">([\s\S]*?)<\/code><\/pre>/g, '```$1\n$2\n```\n')

  // links
  md = md.replace(/<a href="([^"]*)"[^>]*>(.*?)<\/a>/g, '[$2]($1)')

  // lists
  md = md.replace(/<ul>\s*/g, '')
  md = md.replace(/<\/ul>\s*/g, '\n')
  md = md.replace(/<li>(.*?)<\/li>/g, '- $1\n')

  // tables
  md = md.replace(/<table>\s*/g, '')
  md = md.replace(/<\/table>\s*/g, '\n')
  md = md.replace(/<thead>\s*/g, '')
  md = md.replace(/<\/thead>\s*/g, '')
  md = md.replace(/<tbody>\s*/g, '')
  md = md.replace(/<\/tbody>\s*/g, '')
  md = md.replace(/<tr>\s*/g, '| ')
  md = md.replace(/<\/tr>\s*/g, ' |\n')
  md = md.replace(/<th[^>]*>(.*?)<\/th>/g, '$1 | ')
  md = md.replace(/<td[^>]*>(.*?)<\/td>/g, '$1 | ')

  // checkboxes
  md = md.replace(/<li class="task-list-item"><input type="checkbox" class="task-list-item-checkbox" disabled checked>(.*?)<\/li>/g, '- [x] $1\n')
  md = md.replace(/<li class="task-list-item"><input type="checkbox" class="task-list-item-checkbox" disabled>(.*?)<\/li>/g, '- [ ] $1\n')

  // blockquotes
  md = md.replace(/<blockquote class="he-pull">([\s\S]*?)<\/blockquote>/g, '> $1\n\n')

  // Clean up HTML entities
  md = md.replace(/&/g, '&')
  md = md.replace(/</g, '<')
  md = md.replace(/>/g, '>')
  md = md.replace(/"/g, '"')
  md = md.replace(/'/g, "'")
  md = md.replace(/&nbsp;/g, ' ')

  // Remove remaining HTML tags
  md = md.replace(/<[^>]+>/g, '')

  // Normalize whitespace
  md = md.replace(/\n{3,}/g, '\n\n')
  md = md.replace(/^\s+|\s+$/g, '')

  return md
}

// Extract title and deck from HTML
function extractHeader(html) {
  const titleMatch = html.match(/<h1 class="he-title">(.*?)<\/h1>/)
  const title = titleMatch ? titleMatch[1].replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>') : 'Untitled'

  const deckMatch = html.match(/<p class="he-deck">([\s\S]*?)<\/p>/)
  const deck = deckMatch ? deckMatch[1]
    .replace(/<[^>]+>/g, '')
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, "'")
    .replace(/\s+/g, ' ')
    .trim() : ''

  return { title, deck }
}

// Extract section from path
function getSection(filePath) {
  const rel = path.relative(HTML_ROOT, filePath)
  const parts = rel.split(path.sep)
  return parts[0] // audits, compliance, plans, operations
}

// Get relative output path
function getMdOutputPath(htmlPath) {
  const rel = path.relative(HTML_ROOT, htmlPath)
  const parts = rel.split(path.sep)
  const section = parts[0] // audits, compliance, plans, operations
  
  // Handle portal-audits subdirectories
  let mdDir = path.join(MD_ROOT, section)
  let fileName = path.basename(rel, '.html')
  
  if (section === 'audits' && parts[1] === 'portal-audits') {
    if (parts.length === 3) {
      // portal-audits/index.html or portal-audits/PORTAL-AUDIT-TRACKER.html
      mdDir = path.join(MD_ROOT, 'audits', 'portal-audits')
    } else if (parts.length === 4) {
      // portal-audits/{portal}/{file}.html
      const portal = parts[2]
      mdDir = path.join(MD_ROOT, 'audits', 'portal-audits', portal)
    }
  }
  
  return path.join(mdDir, fileName + '.md')
}

async function walkHtml(dir) {
  const out = []
  const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => [])
  for (const ent of entries) {
    const full = path.join(dir, ent.name)
    if (ent.isDirectory()) {
      out.push(...await walkHtml(full))
    } else if (ent.name.endsWith('.html')) {
      out.push(full)
    }
  }
  return out
}

async function main() {
  const files = await walkHtml(HTML_ROOT)
  console.log(`Found ${files.length} HTML files to convert`)

  // Only convert these sections (the proprietary/internal ones)
  const targetSections = ['audits', 'compliance', 'plans', 'operations']
  
  // Files to skip - duplicates at root of audits that exist in portal-audits subdirs
  const skipFiles = new Set([
    'audits/applicant-portal-audit-2026-08-27.html',
    'audits/examiner-portal-audit-2026-08-27.html',
    'audits/instructor-portal-audit-2026-08-27.html',
    'audits/staff-portal-audit-2026-08-27.html',
    'audits/student-portal-audit-2026-08-27.html',
    'audits/staff-code-quality.html',
    'audits/staff-documents-ui-ux-audit.html',
    'audits/staff-easa.html',
    'audits/staff-performance.html',
    'audits/staff-security.html',
    'audits/staff-typescript.html',
    'audits/staff-ui-ux.html',
    'audits/ui-ux-audit-plan.html',
    'audits/staff-api-ui-ux-audit-plan.html',
    'audits/PORTAL-AUDIT-TRACKER.html',
  ].map(f => f.replace(/\//g, path.sep)))
  
  let converted = 0
  for (const htmlPath of files) {
    const rel = path.relative(HTML_ROOT, htmlPath)
    const section = rel.split(path.sep)[0]
    
    // Skip if not in target sections
    if (!targetSections.includes(section)) {
      continue
    }
    // Skip _files directories
    if (rel.includes('_files')) continue
    // Skip duplicate files at root of audits
    if (skipFiles.has(rel)) {
      console.log(`  ⊘ ${rel} (skipped - duplicate)`)
      continue
    }

    const html = await fs.readFile(htmlPath, 'utf8')
    const { title, deck } = extractHeader(html)
    const mdContent = htmlToMd(html)

    // Build frontmatter - just use plain title heading, no YAML frontmatter
    const mdPath = getMdOutputPath(htmlPath)
    await fs.mkdir(path.dirname(mdPath), { recursive: true })
    await fs.writeFile(mdPath, mdContent, 'utf8')
    console.log(`  ✓ ${rel} → ${path.relative(MD_ROOT, mdPath)}`)
    converted++
  }

  console.log(`\nConverted ${converted} files to markdown`)
}

main().catch(err => {
  console.error('Failed:', err)
  process.exit(1)
})