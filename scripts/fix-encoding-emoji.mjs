import { readFileSync, writeFileSync } from 'fs'

const files = [
  'app/staff/dashboard/_components/AlertsCenter.tsx',
  'components/exam-only/MyPoolsDashboard.tsx',
  'components/public/SearchModal.tsx',
]

const replacements = [
  ['\uD83C\uDF89', '\uD83C\uDF89'],
  ['\uD83D\uDCCB', '\uD83D\uDCCB'],
  ['\uD83D\uDCC5', '\uD83D\uDCC5'],
  ['\uD83D\uDCB0', '\uD83D\uDCB0'],
  ['\uD83C\uDFAF', '\uD83C\uDFAF'],
  ['\uD83D\uDCE6', '\uD83D\uDCE6'],
]

let totalReplacements = 0

for (const file of files) {
  let content = readFileSync(file, 'utf8')
  const original = content
  let fileReplacements = 0

  for (const [bad, good] of replacements) {
    const escaped = bad.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const matches = content.match(new RegExp(escaped, 'g'))
    if (matches) {
      const count = matches.length
      content = content.split(bad).join(good)
      fileReplacements += count
      console.log('  ' + file + ': ' + count + 'x ' + JSON.stringify(bad) + ' -> ' + good)
    }
  }

  if (content !== original) {
    writeFileSync(file, content, 'utf8')
    totalReplacements += fileReplacements
    console.log('  Fixed ' + fileReplacements + ' in ' + file)
  } else {
    console.log('  = No changes needed in ' + file)
  }
}

console.log('')
console.log('Total replacements: ' + totalReplacements)
