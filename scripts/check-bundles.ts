import prisma from '../lib/prisma/client'

async function main() {
  const students = await prisma.user.findMany({
    where: { email: { startsWith: 'test' } },
    include: {
      studentProfile: true,
      wallet: true,
      examBundles: { orderBy: { createdAt: 'desc' } },
      examBookings: { where: { deletedAt: null }, take: 5, orderBy: { createdAt: 'desc' } },
      payments: {
        where: { referenceType: 'EXAM_BUNDLE' },
        take: 5,
        orderBy: { createdAt: 'desc' },
      },
    },
    orderBy: { email: 'asc' },
  })

  for (const s of students) {
    console.log('=== ' + s.email + ' (' + s.studentProfile?.studentId + ') ===')
    console.log('  role=' + s.role + ' status=' + s.status)
    console.log(
      '  pathway=' +
        s.studentProfile?.pathwayId +
        ' enrollment=' +
        s.studentProfile?.enrollmentStatus
    )
    console.log('  wallet balance=' + s.wallet?.availableBalance + ' ' + s.wallet?.currency)
    console.log('  bundles=' + s.examBundles.length)
    for (const b of s.examBundles) {
      console.log(
        '    bundle id=' +
          b.id +
          ' type=' +
          b.bundleType +
          ' seats=' +
          b.usedSeats +
          '/' +
          b.totalSeats +
          ' status=' +
          b.status +
          ' amountPaid=' +
          b.amountPaid +
          ' validUntil=' +
          b.validUntil +
          ' createdAt=' +
          b.createdAt
      )
    }
    console.log('  bundle payments=' + s.payments.length)
    for (const p of s.payments) {
      console.log(
        '    payment id=' +
          p.id +
          ' refType=' +
          p.referenceType +
          ' amount=' +
          p.amount +
          ' status=' +
          p.status +
          ' createdAt=' +
          p.createdAt
      )
    }
    console.log('  exam bookings=' + s.examBookings.length)
    for (const b of s.examBookings) {
      console.log(
        '    booking id=' +
          b.id +
          ' module=' +
          b.moduleCode +
          ' type=' +
          b.bookingType +
          ' demand=' +
          b.demandStatus +
          ' status=' +
          b.status +
          ' bundleId=' +
          b.bundleId +
          ' createdAt=' +
          b.createdAt
      )
    }
    console.log('')
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
