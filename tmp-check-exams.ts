import prisma from './lib/prisma/client'

async function checkExams() {
  const total = await prisma.exam.count()
  const upcoming = await prisma.exam.count({
    where: {
      examDate: { gt: new Date() },
    },
  })
  console.log('Total Exams:', total)
  console.log('Upcoming Exams:', upcoming)
  if (upcoming > 0) {
    const list = await prisma.exam.findMany({
      where: { examDate: { gt: new Date() } },
      take: 5,
      select: { id: true, name: true, examDate: true },
    })
    console.log('Sample Upcoming:', JSON.stringify(list, null, 2))
  }
}

checkExams()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
