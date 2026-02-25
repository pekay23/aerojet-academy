import prisma from '@/lib/prisma/client'

/**
 * Checks all SCHEDULED / OPEN Tuition Runs.
 * If startDatetime is within 7 days, and currentEnrollments < minClassSize,
 * cancels the run and refunds all students.
 */
export async function evaluateTuitionRuns() {
  const sevenDaysFromNow = new Date()
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)

  // Find tuition runs starting in <= 7 days, still OPEN or SCHEDULED
  const runsToEvaluate = await prisma.tuitionRun.findMany({
    where: {
      status: { in: ['SCHEDULED', 'OPEN'] },
      startDatetime: { lte: sevenDaysFromNow },
    },
    include: {
      bookings: true,
    },
  })

  let canceledCount = 0
  let confirmedCount = 0

  for (const run of runsToEvaluate) {
    if (run.currentEnrollments < run.minClassSize) {
      // CANCEL AND REFUND
      await prisma.$transaction(async (tx) => {
        // Mark run as cancelled
        await tx.tuitionRun.update({
          where: { id: run.id },
          data: { status: 'CANCELLED' },
        })

        // Refund all bookings
        for (const booking of run.bookings) {
          if (booking.status === 'CONFIRMED') {
            await tx.tuitionBooking.update({
              where: { id: booking.id },
              data: { status: 'CANCELLED' },
            })

            // Refund wallet
            const { creditToWallet } = await import('@/lib/wallet/operations')

            await creditToWallet(
              tx,
              booking.studentId,
              Number(booking.amountPaid),
              `Refund: Tuition Class Cancelled (${run.title})`,
              booking.id,
              'TUITION_REFUND'
            )
          }
        }
      })
      canceledCount++
    } else {
      // Confirm the run
      await prisma.tuitionRun.update({
        where: { id: run.id },
        data: { status: 'CONFIRMED' },
      })
      confirmedCount++
    }
  }

  return { canceledCount, confirmedCount }
}
