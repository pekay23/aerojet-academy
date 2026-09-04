'use server'

import { getAuthSession } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { chargeWallet } from '@/lib/wallet/operations'
import { revalidatePath } from 'next/cache'

export async function bookRevisionRun(runId: string) {
  try {
    const session = await getAuthSession()
    if (!session) return { error: 'Unauthorized' }

    const userId = session.user.id

    // Check if student already booked ANY revision run
    const totalBookings = await prismaUnfiltered.tuitionBooking.count({
      where: { studentId: userId },
    })

    if (totalBookings >= 1) {
      return { error: 'You have already booked a revision run' }
    }

    // Check if run exists and is open
    const run = await prismaUnfiltered.tuitionRun.findUnique({
      where: { id: runId },
    })

    if (!run) return { error: 'Revision run not found' }
    if (run.status !== 'OPEN' && run.status !== 'SCHEDULED') {
      return { error: 'This revision run is not open for booking' }
    }

    if (run.currentEnrollments >= run.capacity) {
      return { error: 'This revision run is at full capacity' }
    }

    // Start transaction using unfiltered client to bypass any RLS restriction for operations
    const result = await prismaUnfiltered.$transaction(async (tx) => {
      // 1. Charge wallet
      await chargeWallet(
        tx,
        userId,
        Number(run.price),
        `Revision Support Booking: ${run.title}`,
        runId,
        'tuition_run'
      )

      // 2. Create booking
      const booking = await tx.tuitionBooking.create({
        data: {
          tuitionRunId: runId,
          studentId: userId,
          amountPaid: run.price,
          status: 'CONFIRMED',
        },
      })

      // 3. Increment enrollment count
      await tx.tuitionRun.update({
        where: { id: runId },
        data: {
          currentEnrollments: { increment: 1 },
          status: run.status === 'SCHEDULED' ? 'OPEN' : run.status,
        },
      })

      return booking
    }, {
      maxWait: 15000,
      timeout: 30000,
    })

    revalidatePath('/student/courses/revision')
    revalidatePath('/staff/revision-runs')
    return { success: true, booking: result }
  } catch (error: any) {
    console.error('Book revision run error:', error)
    return { error: error.message || 'Failed to book revision run' }
  }
}
