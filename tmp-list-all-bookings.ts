import prisma from './lib/prisma/client'

async function main() {
  const count = await prisma.examBooking.count()
  console.log(`Total Bookings: ${count}`)

  const samples = await prisma.examBooking.findMany({
    take: 10,
    include: { user: { select: { email: true } } },
  })
  console.log('Sample Bookings:', JSON.stringify(samples, null, 2))
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
  })
