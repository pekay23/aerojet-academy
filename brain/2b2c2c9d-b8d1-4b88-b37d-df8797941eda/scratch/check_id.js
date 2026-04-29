import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const id = 'cmoafksby0002hofgxotog6q2'
  console.log('Checking ID:', id)
  
  const result = await prisma.examResult.findUnique({
    where: { id },
    select: { id: true, userId: true, moduleCode: true, examCategory: true }
  })
  console.log('ExamResult:', result)

  const booking = await prisma.examBooking.findUnique({
    where: { id },
    select: { id: true, userId: true, moduleCode: true, examCategory: true }
  })
  console.log('ExamBooking:', booking)

  if (result) {
    const linkedBookings = await prisma.examBooking.findMany({
      where: { userId: result.userId, moduleCode: { equals: result.moduleCode, mode: 'insensitive' } },
      select: { id: true, examCategory: true, moduleCode: true }
    })
    console.log('Linked Bookings (Insensitive):', linkedBookings)
  }
}

main().catch(console.error).finally(() => prisma.$disconnect())
