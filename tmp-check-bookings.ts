import prisma from './lib/prisma/client'

async function main() {
  const MIGRATION_REF = 'EXAM_CANDIDATE_IMPORT_2026_03'
  const count = await prisma.examBooking.count({
    where: { migrationRef: MIGRATION_REF },
  })
  console.log(`Bookings with migrationRef ${MIGRATION_REF}: ${count}`)

  const samples = await prisma.examBooking.findMany({
    where: { migrationRef: MIGRATION_REF },
    take: 5,
    include: { user: { select: { email: true } } },
  })
  console.log(
    'Sample Bookings User Emails:',
    samples.map((s) => s.user.email)
  )
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
  })
