import { readFileSync, writeFileSync } from 'fs'

const files = [
  'app/staff/exams/internal/_components/ExamBankManager.tsx',
  'docs/html/design-system.html',
]

const replacements = [
  ['Ã—', '×'],
  ['Â·', '·'],
  ['\u00E2\u20AC\u201C', '–'],
  ['\u00E2\u20AC\u201D', '—'],
  ['\u00E2\u0153\u2026', '✅'],
  ['\u00E2\u2030\u00A5', '≥'],
  ['\u00E2\u2020\u0090', '←'],
  ['\u00E2\u20AC\u00A6', '…'],
]

let totalReplacements = 0

for (const file of files) {
  let content = readFileSync(file, 'utf8')
  const original = content
  let fileReplacements = 0

  for (const [bad, good] of replacements) {
    const count = (content.match(new RegExp(bad.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length
    if (count > 0) {
      content = content.split(bad).join(good)
      fileReplacements += count
      console.log(`  ${file}: ${count}x ${JSON.stringify(bad)} → ${good}`)
    }
  }

  if (content !== original) {
    writeFileSync(file, content, 'utf8')
    totalReplacements += fileReplacements
    console.log(`  ✓ Fixed ${fileReplacements} in ${file}`)
  } else {
    console.log(`  = No changes needed in ${file}`)
  }
}

console.log(`\nTotal replacements: ${totalReplacements}`)
