import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log('--- Courses ---')
  const courses = await prisma.course.findMany({
    select: { id: true, code: true, name: true, isActive: true }
  })
  console.log('Total courses:', courses.length)
  console.log('Active courses:', courses.filter(c => c.isActive).length)
  if (courses.length > 0) {
    console.log('Sample course:', courses[0])
  }
}

main().catch(console.error).finally(() => prisma.$disconnect())
