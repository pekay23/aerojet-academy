import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'

const csvDir = path.join(process.cwd(), 'scripts', 'easa-seed', 'csvs')
const files = readdirSync(csvDir).filter((f) => f.endsWith('.csv'))

let totalLines = 0
for (const f of files) {
  const content = readFileSync(path.join(csvDir, f), 'utf-8')
  const lines = content.split('\n').length
  console.log(`${f}: ${lines} lines`)
  totalLines += lines
}
console.log(`Total CSV lines: ${totalLines}`)
