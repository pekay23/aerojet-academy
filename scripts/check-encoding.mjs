import { readFileSync, readdirSync, statSync } from 'fs'

const dirs = ['app', 'lib', 'components', 'docs', 'tests', 'prisma']
const skipDirs = new Set(['node_modules', '.next', '.venv', '__pycache__', 'scripts'])
const extensions = /\.(ts|tsx|js|jsx|md|json|mjs|html)$/

// Encoding documentation files legitimately contain mojibake examples.
const skipFiles = new Set([
  'docs/audits/2026-09-08-encoding-mojibake-fixes.md',
  'docs/operations/encoding-fix-scripts.md',
  'docs/operations/encoding-prevention.md',
  // Generated HTML mirrors of the docs above intentionally document mojibake examples
  'docs/html/audits/2026-09-08-encoding-mojibake-fixes.html',
  'docs/html/operations/encoding-fix-scripts.html',
  'docs/html/operations/encoding-prevention.html',
])

const badPrefixes = ['â', 'Ã', 'Â', 'ð']
let badFiles = 0
let badInstances = 0

function walk(dir) {
  const entries = readdirSync(dir, { withFileTypes: true })
  for (const e of entries) {
    const p = dir + '/' + e.name
    if (skipDirs.has(e.name)) continue
    if (e.isDirectory()) walk(p)
    else if (extensions.test(e.name)) {
      if (skipFiles.has(p)) continue
      const content = readFileSync(p, 'utf8')
      let fileBad = 0
      for (let i = 0; i < content.length; i++) {
        if (badPrefixes.includes(content[i])) {
          fileBad++
          badInstances++
        }
      }
      if (fileBad > 0) {
        badFiles++
        console.log(`  ${p}: ${fileBad} instance(s)`)
      }
    }
  }
}

for (const d of dirs) {
  if (statSync(d).isDirectory()) walk(d)
}

if (badFiles > 0) {
  console.error(`\n❌ Mojibake detected in ${badFiles} file(s), ${badInstances} total instance(s).`)
  console.error('Run: bun run scripts/fix-encoding-all.mjs')
  process.exit(1)
} else {
  console.log('✅ No mojibake detected.')
  process.exit(0)
}
