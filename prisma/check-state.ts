import { prismaUnfiltered } from '../lib/prisma/client'

async function main() {
  const enrollmentCount = await prismaUnfiltered.enrollment.count()
  console.log('Enrollments:', enrollmentCount)

  const classCount = await prismaUnfiltered.class.count()
  console.log('Classes:', classCount)

  const sessionCount = await prismaUnfiltered.classSession.count()
  console.log('ClassSessions:', sessionCount)

  const bankCount = await prismaUnfiltered.internalExamBank.count()
  console.log('ExamBanks:', bankCount)

  const questionCount = await prismaUnfiltered.internalExamQuestion.count()
  console.log('Questions:', questionCount)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prismaUnfiltered.$disconnect()
  })
