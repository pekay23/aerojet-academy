import prisma from '../lib/prisma/client'

// Check specific bookings for students
const emails = [
  'd.archer@aerojet-academy.com',
  'a.adam@aerojet-academy.com', 
  'd.korku@aerojet-academy.com',
  'e.avege@aerojet-academy.com',
  'p.wiafe@aerojet-academy.com',
]

async function main() {
  console.log('Checking exam booking details...\n')

  for (const email of emails) {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true },
    })

    if (!user) continue

    console.log(`\n👤 ${user.email} (${user.id})`)

    const bookings = await prisma.examBooking.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        moduleCode: true,
        status: true,
        examDate: true,
        result: true,
        score: true,
        percentage: true,
        bookingType: true,
        exam: {
          select: {
            name: true,
            examComponent: {
              select: {
                code: true,
                name: true,
              }
            }
          }
        }
      },
      orderBy: { bookedAt: 'asc' },
    })

    console.log(`   Bookings: ${bookings.length}`)
    for (const b of bookings) {
      console.log(`   - Module: ${b.moduleCode || 'N/A'}, Status: ${b.status}, Date: ${b.examDate || 'TBD'}, Result: ${b.result || 'pending'}`)
      console.log(`     Booking Type: ${b.bookingType}, Score: ${b.score || 'N/A'}, %: ${b.percentage || 'N/A'}`)
      console.log(`     Exam: ${JSON.stringify(b.exam)}`)
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
