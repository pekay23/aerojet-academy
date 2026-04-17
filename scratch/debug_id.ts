import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const id = 'cmmaev75p0003fcf7ir21roee'
  
  const event = await prisma.examEvent.findUnique({ where: { id } })
  if (event) {
    console.log('ID belongs to an ExamEvent:', event.name)
    return
  }

  const pool = await prisma.examPool.findUnique({ where: { id } })
  if (pool) {
    console.log('ID belongs to an ExamPool:', pool.name)
    return
  }

  console.log('ID not found in ExamEvent or ExamPool')
}

main().catch(console.error).finally(() => prisma.$disconnect())
