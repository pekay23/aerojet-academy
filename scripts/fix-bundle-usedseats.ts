/**
 * Reconcile orphaned bundle usedSeats count.
 *
 * The seed created an ExamBundle with usedSeats=1 but no corresponding
 * ExamBooking rows. This script finds bundles where usedSeats > 0 but
 * the actual ExamBooking count is lower, and resets usedSeats to match
 * the real booking count. It also marks fully-consumed bundles EXHAUSTED.
 *
 * Run: bunx tsx scripts/fix-bundle-usedseats.ts
 */
import prisma from '../lib/prisma/client'

async function main() {
  const bundles = await prisma.examBundle.findMany({
    where: { status: 'ACTIVE' },
    include: {
      _count: { select: { bookings: true } },
    },
  })

  let fixed = 0
  for (const b of bundles) {
    const actual = b._count.bookings
    if (b.usedSeats !== actual) {
      const newStatus = actual >= b.totalSeats ? 'EXHAUSTED' : 'ACTIVE'
      await prisma.examBundle.update({
        where: { id: b.id },
        data: { usedSeats: actual, status: newStatus },
      })
      console.log(
        `[FIX] bundle=${b.id} bundleType=${b.bundleType} totalSeats=${b.totalSeats} ` +
          `usedSeats ${b.usedSeats} → ${actual} status → ${newStatus}`
      )
      fixed++
    }
  }

  console.log(`\nDone. ${fixed} bundle(s) reconciled.`)
}

main()
  .catch((err) => {
    console.error('Fatal error:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
