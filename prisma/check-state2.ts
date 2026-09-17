import { prismaUnfiltered } from '../lib/prisma/client'

async function main() {
  const courses = await prismaUnfiltered.course.findMany({
    where: { code: { in: ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7'] } },
    select: { id: true, code: true, name: true },
  })
  console.log('Courses:', JSON.stringify(courses, null, 2))

  const classes = await prismaUnfiltered.class.findMany({
    take: 10,
    select: { id: true, name: true, courseId: true },
  })
  console.log('Classes:', JSON.stringify(classes, null, 2))

  const banks = await prismaUnfiltered.internalExamBank.findMany({
    select: { id: true, name: true, courseId: true },
  })
  console.log('Banks:', JSON.stringify(banks, null, 2))
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prismaUnfiltered.$disconnect()
  })
