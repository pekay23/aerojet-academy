import { NextRequest } from 'next/server'
import { getAuthSession } from '@/lib/auth/helpers'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { transitionApplication } from '@/lib/admissions/state-machine'
import { getInterviewConfig } from '@/lib/settings'
import { z } from 'zod'

const schema = z.object({
  slotId: z.string()
})

export const POST = withErrorHandler(async (req: NextRequest) => {
  const session = await getAuthSession()
  if (!session?.user) return apiError('Unauthorized', 401)
  const userId = session.user.id

  const body = await req.json()
  const result = schema.safeParse(body)
  if (!result.success) return apiError('Invalid input')
  const { slotId } = result.data

  const application = await prismaUnfiltered.application.findUnique({
    where: { userId }
  })

  if (!application) return apiError('Application not found', 404)
  if (application.stage !== 'INTERVIEW_PENDING' && application.stage !== 'INTERVIEW_SCHEDULED') {
    return apiError('Not eligible for interview booking', 400)
  }

  const slot = await prismaUnfiltered.interviewSlot.findUnique({
    where: { id: slotId }
  })

  if (!slot) return apiError('Slot not found', 404)
  if (slot.bookedCount >= slot.capacity && application.interviewSlotId !== slotId) {
    return apiError('Slot is fully booked', 400)
  }

  const config = await getInterviewConfig()

  // Reschedule constraints
  if (application.interviewSlotId && application.interviewSlotId !== slotId) {
    if (application.interviewRescheduleCount >= config.interview_max_reschedules) {
      return apiError(`You have reached the maximum number of allowed reschedules (${config.interview_max_reschedules})`, 400)
    }

    // Fetch the old slot to check cutoff
    const oldSlot = await prismaUnfiltered.interviewSlot.findUnique({ where: { id: application.interviewSlotId } })
    if (oldSlot) {
      const hoursUntilInterview = (oldSlot.startTime.getTime() - Date.now()) / (1000 * 60 * 60)
      if (hoursUntilInterview < config.interview_reschedule_cutoff_hours) {
        return apiError(`Cannot reschedule within ${config.interview_reschedule_cutoff_hours} hours of the scheduled interview`, 400)
      }
    }
  }

  // Use a transaction to safely book the slot with concurrency-safe capacity check
  const bookingResult = await prismaUnfiltered.$transaction(async (tx) => {
    // If they already have a slot, decrement the old one
    if (application.interviewSlotId && application.interviewSlotId !== slotId) {
      await tx.interviewSlot.update({
        where: { id: application.interviewSlotId },
        data: { bookedCount: { decrement: 1 } }
      })
    }

    // Assign the new slot
    await tx.application.update({
      where: { id: application.id },
      data: {
        interviewSlotId: slotId,
        interviewRescheduleCount: application.interviewSlotId && application.interviewSlotId !== slotId 
          ? { increment: 1 } 
          : undefined
      }
    })

    // Increment new slot count atomically so concurrent bookings cannot overfill the slot.
    if (application.interviewSlotId !== slotId) {
      const incremented = await tx.interviewSlot.updateMany({
        where: { id: slotId, bookedCount: { lt: slot.capacity } },
        data: { bookedCount: { increment: 1 } }
      })
      if (incremented.count === 0) {
        throw new Error('SLOT_FULL')
      }
    }
    return { ok: true as const }
  }).catch((err: any) => {
    if (err.message === 'SLOT_FULL') {
      return { ok: false as const, error: 'Slot is fully booked (concurrent booking detected)' }
    }
    throw err
  })

  if (bookingResult.ok === false) {
    return apiError(bookingResult.error, 409)
  }

  // State Machine Transition if they were just pending
  if (application.stage === 'INTERVIEW_PENDING') {
    await transitionApplication(application.id, 'INTERVIEW_SCHEDULED', userId)
  }

  return apiSuccess({ success: true })
})
