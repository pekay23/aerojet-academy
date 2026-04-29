import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log('--- Exam Components ---')
  const components = await prisma.examComponent.findMany({
    select: { id: true, code: true, name: true, type: true, courseId: true },
    take: 20
  })
  console.log('Total sample components:', components.length)
  components.forEach(c => console.log(`Code: ${c.code}, Name: ${c.name}, Type: ${c.type}`))
}

main().catch(console.error).finally(() => prisma.$disconnect())
