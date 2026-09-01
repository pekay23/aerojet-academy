// Create missing loading.tsx files for all routes
const fs = require('fs')
const path = require('path')

const dirs = [
  // Staff Portal - dynamic routes
  'app/staff/admissions/aptitude/banks/[id]',
  'app/staff/classes/[id]',
  'app/staff/classes/[id]/edit',
  'app/staff/classes/[id]/roster',
  'app/staff/classes/[id]/seating',
  'app/staff/classrooms/[id]',
  'app/staff/courses/[id]',
  'app/staff/courses/[id]/edit',
  'app/staff/documents/expiring',
  'app/staff/exams/events/[id]',
  'app/staff/exams/events/[id]/edit',
  'app/staff/exams/events/[id]/manifest',
  'app/staff/exams/events/[id]/pools/create',
  'app/staff/exams/internal/banks/[bankId]/questions',
  'app/staff/exams/pools/[id]',
  'app/staff/exams/pools/[id]/add-candidate',
  'app/staff/exams/pools/[id]/edit',
  'app/staff/exams/sittings/[id]/seating',
  'app/staff/newsroom/[id]/edit',
  'app/staff/ojt/[logbookId]',
  'app/staff/students/[id]',
  'app/staff/users/[id]',
  // Student Portal
  'app/student/courses/[slug]',
  'app/student/courses/[slug]/grades',
  'app/student/courses/[slug]/materials',
  'app/student/exam-bookings/[id]',
  'app/student/exam-bookings/[id]/join',
  'app/student/exams/internal/results/[sessionId]',
  'app/student/exams/internal/[sessionId]',
  // Instructor Portal
  'app/instructor/attendance/[id]',
  'app/instructor/classes/[id]',
  'app/instructor/classes/[id]/attendance',
  'app/instructor/classes/[id]/grades',
  'app/instructor/classes/[id]/materials',
  'app/instructor/classes/[id]/roster',
  'app/instructor/students/[id]',
  // Applicant Portal
  'app/applicant/courses/[id]',
  'app/applicant/courses/[id]/purchase',
  'app/applicant/exam-bookings/[id]',
  'app/applicant/exam-only/join-pool',
  'app/applicant/exam-only/join-waitlist',
  // Examiner Portal
  'app/examiner/sittings/[id]',
]

const template = `import { TableSkeleton } from '@/components/shared/DashboardSkeleton'

export default function Loading() {
  return <TableSkeleton rows={10} />
}
`

let created = 0
let skipped = 0

for (const dir of dirs) {
  const fullPath = path.join(process.cwd(), dir, 'loading.tsx')
  if (fs.existsSync(fullPath)) {
    console.log('SKIP (exists):', dir)
    skipped++
  } else {
    fs.mkdirSync(path.dirname(fullPath), { recursive: true })
    fs.writeFileSync(fullPath, template, 'utf8')
    console.log('Created:', dir)
    created++
  }
}

console.log(`\n--- Created: ${created}, Skipped: ${skipped} ---`)
