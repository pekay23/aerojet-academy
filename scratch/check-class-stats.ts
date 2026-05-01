import { prismaUnfiltered as prisma } from '../lib/prisma/client'

async function main() {
  const classes = await prisma.class.findMany({
    include: { _count: { select: { attendanceRecords: true } } }
  })
  const stats = classes.map(c => ({
    id: c.id,
    name: c.name,
    instructor: c.instructorId,
    studentCountField: c.currentStudents,
    attendanceRecordsCount: c._count.attendanceRecords
  }))
  console.log(JSON.stringify(stats, null, 2))
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
