import prisma from '../lib/prisma/client'

async function main() {
  const students = await prisma.user.findMany({
    where: { role: 'STUDENT' },
    select: {
      id: true,
      email: true,
      studentProfile: {
        select: {
          studentId: true,
        }
      }
    },
    orderBy: { email: 'asc' },
    take: 30,
  })

  console.log('Found', students.length, 'students:')
  for (const s of students) {
    console.log(`  ${s.email} (ID: ${s.studentProfile?.studentId || 'N/A'})`)
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
