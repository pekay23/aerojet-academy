import { prismaUnfiltered as prisma } from '../lib/prisma/client'

async function main() {
  const emptyClasses = await prisma.class.findMany({
    where: {
      instructorId: { not: null },
      currentStudents: 0
    },
    include: {
      course: { select: { code: true, name: true } },
      instructor: { include: { user: { select: { email: true, profile: { select: { firstName: true, lastName: true } } } } } }
    }
  })
  console.log(JSON.stringify(emptyClasses, null, 2))
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
