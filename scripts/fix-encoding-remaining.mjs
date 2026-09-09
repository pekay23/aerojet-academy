import { readFileSync, writeFileSync } from 'fs'

const files = [
  'app/staff/exams/internal/_components/ExamOperations.tsx',
  'app/staff/settings/_components/EmailDeliveryTab.tsx',
  'components/CurrencyToggle.tsx',
  'components/public/SearchModal.tsx',
]

const replacements = [
  ['â†' + '\u2019', '→'],
  ['â†' + '\u2018', '↑'],
  ['â†' + '\u201C', '↓'],
  ['â†' + '\u00B5', '↕'],
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
