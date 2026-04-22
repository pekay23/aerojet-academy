import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const bookings = await prisma.$queryRaw`SELECT id, "attemptType" FROM exam_bookings WHERE "attemptType" IS NOT NULL LIMIT 10`
  console.log('Bookings:', bookings)
  const results = await prisma.$queryRaw`SELECT id, "attemptType" FROM exam_results WHERE "attemptType" IS NOT NULL LIMIT 10`
  console.log('Results:', results)
}

main().finally(() => prisma.$disconnect())
