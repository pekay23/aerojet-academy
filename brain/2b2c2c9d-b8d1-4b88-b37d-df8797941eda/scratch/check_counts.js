import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const courses = await prisma.course.findMany({ select: { code: true, name: true } })
  const components = await prisma.examComponent.findMany({ select: { code: true, name: true } })
  
  console.log('Courses:', courses.length)
  if (courses.length > 0) console.log('Sample Course:', courses[0])
  
  console.log('Components:', components.length)
  if (components.length > 0) console.log('Sample Component:', components[0])
}

main().catch(console.error).finally(() => prisma.$disconnect())
