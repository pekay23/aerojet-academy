import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://neondb_owner:npg_lPmU1f4rKBkj@ep-wandering-wave-ahyik1io-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&uselibpqcompat=true&channel_binding=require&connection_limit=50&pool_timeout=30"
    }
  }
})

async function main() {
  const bookings = await prisma.examBooking.findMany({
    where: {
      OR: [
        { attemptType: { contains: 'migrated', mode: 'insensitive' } },
        { result: { contains: 'migrated', mode: 'insensitive' } },
        { exam: { name: { contains: 'migrated', mode: 'insensitive' } } }
      ]
    },
    include: { exam: true },
    take: 10
  })

  console.log('Bookings with "migrated":', JSON.stringify(bookings, null, 2))

  const results = await prisma.examResult.findMany({
    where: {
      OR: [
        { attemptType: { contains: 'migrated', mode: 'insensitive' } },
        { sourceNotes: { contains: 'migrated', mode: 'insensitive' } },
        { exam: { name: { contains: 'migrated', mode: 'insensitive' } } }
      ]
    },
    include: { exam: true },
    take: 10
  })

  console.log('Results with "migrated":', JSON.stringify(results, null, 2))
}

main().catch(console.error).finally(() => prisma.$disconnect())
