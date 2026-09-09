import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs'

const dirs = ['app', 'lib', 'components', 'docs', 'tests', 'prisma']
const skipDirs = new Set(['node_modules', '.next', '.venv', '__pycache__', 'scripts'])

const replacements = [
  ['âœˆï¸', '✈'],
  ['âœ…', '✅'],
  ['â†µ', '↕'],
  ['â†' + '\u201C', '↓'],
  ['â†' + '\u2019', '→'],
  ['â†' + '\u2018', '↑'],
  ['â†' + '\u0090', '←'],
  ['â‚¬', '€'],
  ['â‚µ', '₵'],
]

let totalReplacements = 0

function walk(dir) {
  const entries = readdirSync(dir, { withFileTypes: true })
  for (const e of entries) {
    const p = dir + '/' + e.name
    if (skipDirs.has(e.name)) continue
    if (e.isDirectory()) walk(p)
    else if (/\.(ts|tsx|js|jsx|md|json|mjs)$/.test(e.name)) {
      let content = readFileSync(p, 'utf8')
      const original = content
      let fileReplacements = 0

      for (const [bad, good] of replacements) {
        const escaped = bad.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        const matches = content.match(new RegExp(escaped, 'g'))
        if (matches) {
          const count = matches.length
          content = content.split(bad).join(good)
          fileReplacements += count
          console.log(`  ${p}: ${count}x ${JSON.stringify(bad)} → ${good}`)
        }
      }

      if (content !== original) {
        writeFileSync(p, content, 'utf8')
        totalReplacements += fileReplacements
        console.log(`  ✓ Fixed ${fileReplacements} in ${p}`)
      }
    }
  }
}

for (const d of dirs) {
  if (statSync(d).isDirectory()) walk(d)
}

console.log(`\nTotal replacements: ${totalReplacements}`)
