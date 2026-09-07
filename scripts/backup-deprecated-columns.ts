import 'server-only'
import { prismaUnfiltered } from '../lib/prisma/client'

async function backup() {
  // Backup attendance_records.sessionType
  const attendanceRows = await prismaUnfiltered.$queryRaw`
    SELECT id, sessionType FROM attendance_records WHERE sessionType IS NOT NULL
  `
  console.log(`Backing up ${attendanceRows.length} attendance_records.sessionType rows`)

  // Backup internal_exam_question_versions.difficulty
  const difficultyRows = await prismaUnfiltered.$queryRaw`
    SELECT id, difficulty FROM internal_exam_question_versions WHERE difficulty IS NOT NULL
  `
  console.log(`Backing up ${difficultyRows.length} question_versions.difficulty rows`)

  // Backup internal_exam_question_versions.changeType
  const changeTypeRows = await prismaUnfiltered.$queryRaw`
    SELECT id, changeType FROM internal_exam_question_versions WHERE changeType IS NOT NULL
  `
  console.log(`Backing up ${changeTypeRows.length} question_versions.changeType rows`)

  // Create backup tables
  await prismaUnfiltered.$executeRaw`
    CREATE TABLE IF NOT EXISTS _backup_attendance_records_sessiontype AS
    SELECT id, sessionType FROM attendance_records WHERE sessionType IS NOT NULL
  `

  await prismaUnfiltered.$executeRaw`
    CREATE TABLE IF NOT EXISTS _backup_question_versions_difficulty AS
    SELECT id, difficulty FROM internal_exam_question_versions WHERE difficulty IS NOT NULL
  `

  await prismaUnfiltered.$executeRaw`
    CREATE TABLE IF NOT EXISTS _backup_question_versions_changeType AS
    SELECT id, changeType FROM internal_exam_question_versions WHERE changeType IS NOT NULL
  `

  console.log('Backup complete')
}

backup().catch(err => {
  console.error(err)
  process.exit(1)
})


