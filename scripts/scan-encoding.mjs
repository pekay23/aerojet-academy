import { readFileSync, readdirSync, statSync } from 'fs'

const dirs = ['app', 'lib', 'components', 'docs', 'tests', 'prisma']
const patterns = {}

function walk(dir) {
  const entries = readdirSync(dir, { withFileTypes: true })
  for (const e of entries) {
    const p = dir + '/' + e.name
    if (e.name === 'node_modules' || e.name === '.next' || e.name === '.venv' || e.name === '__pycache__' || e.name === 'scripts') continue
    if (e.isDirectory()) walk(p)
    else if (/\.(ts|tsx|js|jsx|md|json|mjs)$/.test(e.name)) {
      const content = readFileSync(p, 'utf8')
      for (let i = 0; i < content.length; i++) {
        if (content[i] === 'â') {
          const seq = content.slice(i, i + 6)
          if (!patterns[seq]) patterns[seq] = { count: 0, examples: [] }
          patterns[seq].count++
          if (patterns[seq].examples.length < 3) {
            patterns[seq].examples.push(content.slice(Math.max(0, i - 10), i + 20))
          }
        }
      }
    }
  }
}

for (const d of dirs) {
  if (statSync(d).isDirectory()) walk(d)
}

console.log('Mis-encoded patterns starting with â (excluding scripts):')
console.log('='.repeat(80))
for (const [pattern, data] of Object.entries(patterns)) {
  console.log(`\nPattern: ${JSON.stringify(pattern)}`)
  console.log(`Count: ${data.count}`)
  for (const ex of data.examples) {
    console.log(`  Example: ${JSON.stringify(ex)}`)
  }
}
