import { readdirSync, statSync } from 'node:fs'
import path from 'node:path'

function walkDir(dir: string): string[] {
  const results: string[] = []
  for (const entry of readdirSync(dir)) {
    const fullPath = path.join(dir, entry)
    if (statSync(fullPath).isDirectory()) {
      results.push(...walkDir(fullPath))
    } else if (entry.toLowerCase().endsWith('.txt')) {
      results.push(fullPath)
    }
  }
  return results
}

const root = 'C:/Users/Pekay/OneDrive - Ghana Communication Technology University/AerojetAviation'
const txtFiles = walkDir(root)

console.log(`Found ${txtFiles.length} .txt files:`)
for (const f of txtFiles) {
  console.log(f)
}
