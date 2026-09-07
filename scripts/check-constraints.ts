import 'server-only'
import { prismaUnfiltered } from '../lib/prisma/client'

async function checkConstraints() {
  // Check for duplicate sessionIds in certificates
  const duplicateCertificates = await prismaUnfiltered.$queryRaw`
    SELECT "sessionId", COUNT(*) as count
    FROM certificates
    WHERE "sessionId" IS NOT NULL
    GROUP BY "sessionId"
    HAVING COUNT(*) > 1
  `
  console.log(`Duplicate certificates by sessionId: ${(duplicateCertificates as unknown[]).length}`)
  if ((duplicateCertificates as unknown[]).length > 0) {
    console.log('Sample duplicates:', (duplicateCertificates as unknown[]).slice(0, 5))
  }

  // Check for duplicate sessionId+userId in internal_exam_registrations
  const duplicateRegistrations = await prismaUnfiltered.$queryRaw`
    SELECT "sessionId", "userId", COUNT(*) as count
    FROM internal_exam_registrations
    GROUP BY "sessionId", "userId"
    HAVING COUNT(*) > 1
  `
  console.log(`Duplicate registrations by sessionId+userId: ${(duplicateRegistrations as unknown[]).length}`)
  if ((duplicateRegistrations as unknown[]).length > 0) {
    console.log('Sample duplicates:', (duplicateRegistrations as unknown[]).slice(0, 5))
  }

  // Check if columns we deprecated still exist
  const attendanceColumns = await prismaUnfiltered.$queryRaw`
    SELECT column_name::text FROM information_schema.columns
    WHERE table_name = 'attendance_records' AND column_name = 'sessionType'
  `
  console.log(`attendance_records.sessionType exists: ${(attendanceColumns as unknown[]).length > 0}`)

  const qvColumns = await prismaUnfiltered.$queryRaw`
    SELECT column_name::text FROM information_schema.columns
    WHERE table_name = 'internal_exam_question_versions' AND column_name IN ('difficulty', 'changeType')
  `
  console.log(`question_versions.difficulty/changeType exist: ${(qvColumns as unknown[]).length > 0}`)
}

checkConstraints().catch(err => {
  console.error(err)
  process.exit(1)
})



