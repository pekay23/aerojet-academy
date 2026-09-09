import { readFileSync, writeFileSync } from 'fs'

const files = [
  'app/instructor/exams/_components/InstructorExamsDashboard.tsx',
  'app/staff/_components/ReportsPanel.tsx',
  'app/staff/exams/_components/RecordsTab.tsx',
  'app/staff/exams/internal/preview/_components/ExamPreviewClient.tsx',
  'app/staff/finance/refunds/_components/RefundsManager.tsx',
  'app/staff/settings/_components/EmailRegistryTab.tsx',
  'app/student/exams/internal/_components/InternalExamInterface.tsx',
  'components/layouts/DashboardSidebar.tsx',
  'components/Tour/AppTour.tsx',
]

let totalReplacements = 0

for (const file of files) {
  let content = readFileSync(file, 'utf8')
  const original = content
  let fileReplacements = 0

  // Replace box-drawing mis-encoding: â"€ → ─
  const boxMatches = content.match(/â\u201D€/g)
  if (boxMatches) {
    const count = boxMatches.length
    content = content.replace(/â\u201D€/g, '─')
    fileReplacements += count
    console.log(`  ${file}: ${count}x â"€ → ─`)
  }

  // Fix â‚¬ (Euro sign mis-encoding) if present
  const euroMatches = content.match(/â‚¬/g)
  if (euroMatches) {
    const count = euroMatches.length
    content = content.replace(/â‚¬/g, '€')
    fileReplacements += count
    console.log(`  ${file}: ${count}x â‚¬ → €`)
  }

  // Fix Â· (middle dot mis-encoding) if present
  const dotMatches = content.match(/Â·/g)
  if (dotMatches) {
    const count = dotMatches.length
    content = content.replace(/Â·/g, '·')
    fileReplacements += count
    console.log(`  ${file}: ${count}x Â· → ·`)
  }

  if (content !== original) {
    writeFileSync(file, content, 'utf8')
    totalReplacements += fileReplacements
    console.log(`  ✓ Fixed ${fileReplacements} replacements in ${file}`)
  } else {
    console.log(`  = No changes needed in ${file}`)
  }
}

console.log(`\nTotal replacements: ${totalReplacements}`)
