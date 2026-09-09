import 'server-only'
import { prismaUnfiltered } from '../lib/prisma/client'

async function main() {
  const [banks, questions, sessions, answers, qVersions] = await Promise.all([
    prismaUnfiltered.internalExamBank.count(),
    prismaUnfiltered.internalExamQuestion.count(),
    prismaUnfiltered.internalExamSession.count(),
    prismaUnfiltered.internalExamAnswer.count(),
    prismaUnfiltered.internalExamQuestionVersion.count(),
  ])

  console.log('Pre-deletion counts:')
  console.log(JSON.stringify({ banks, questions, sessions, answers, qVersions }, null, 2))

  console.log('\nDeleting in dependency order (sessions -> questions -> banks)...')
  const [deletedSessions, deletedQuestions, deletedBanks] = await prismaUnfiltered.$transaction(
    async (tx) => {
      const sessions = await tx.internalExamSession.deleteMany()
      const questions = await tx.internalExamQuestion.deleteMany()
      const banks = await tx.internalExamBank.deleteMany()
      return [sessions, questions, banks]
    }
  )

  console.log(`Deleted ${deletedSessions.count} InternalExamSession records`)
  console.log(`Deleted ${deletedQuestions.count} InternalExamQuestion records`)
  console.log(`Deleted ${deletedBanks.count} InternalExamBank records`)

  const [remainingQuestions, remainingBanks] = await Promise.all([
    prismaUnfiltered.internalExamQuestion.count(),
    prismaUnfiltered.internalExamBank.count(),
  ])

  console.log('\nPost-deletion counts:')
  console.log(JSON.stringify({ remainingQuestions, remainingBanks }, null, 2))

  if (remainingQuestions === 0 && remainingBanks === 0) {
    console.log('\n✅ Confirmed: both tables are empty.')
  } else {
    console.log('\n❌ ERROR: counts are not 0 after deletion.')
    process.exitCode = 1
  }

  await prismaUnfiltered.$disconnect()
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exitCode = 1
})
