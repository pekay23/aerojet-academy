
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { profile: { firstName: { contains: 'Edith', mode: 'insensitive' } } },
        { profile: { lastName: { contains: 'Edith', mode: 'insensitive' } } },
      ]
    },
    include: {
      profile: true,
      studentProfile: true
    }
  })

  console.log('--- Students ---')
  for (const u of users) {
    console.log(`[${u.id}] ${u.profile?.firstName} ${u.profile?.lastName} (${u.email})`)
    
    const bookings = await prisma.examBooking.findMany({
      where: { userId: u.id, moduleCode: { contains: 'M9', mode: 'insensitive' } }
    })
    console.log(`  Bookings for M9: ${bookings.length}`)
    bookings.forEach(b => {
      console.log(`    - ID: ${b.id}, Type: ${b.bookingType}, Status: ${b.status}, Result: ${b.result}`)
    })

    const results = await prisma.examResult.findMany({
      where: { userId: u.id, moduleCode: { contains: 'M9', mode: 'insensitive' } }
    })
    console.log(`  Results for M9: ${results.length}`)
    results.forEach(r => {
      console.log(`    - ID: ${r.id}, Score: ${r.score}, MigrationRef: ${r.migrationRef}`)
    })
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
