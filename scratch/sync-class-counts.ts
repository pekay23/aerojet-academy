import { prismaUnfiltered as prisma } from '../lib/prisma/client'

async function main() {
  console.log('🔄 Synchronizing class student counts...')
  const classes = await prisma.class.findMany({
    include: { attendanceRecords: { select: { userId: true }, distinct: ['userId'] } }
  })

  for (const c of classes) {
    const actualCount = c.attendanceRecords.length
    await prisma.class.update({
      where: { id: c.id },
      data: { currentStudents: actualCount }
    })
    console.log(`✅ Updated Class ${c.name} with ${actualCount} students.`)
  }
  console.log('✨ Synchronization complete!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
