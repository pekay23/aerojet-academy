import { getAuthSession } from '@/lib/auth/helpers'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { prismaUnfiltered } from '@/lib/prisma/client'

export const GET = withErrorHandler(async () => {
  const session = await getAuthSession()
  if (!session?.user) return apiError('Unauthorized', 401)

  const application = await prismaUnfiltered.application.findUnique({
    where: { userId: session.user.id },
    select: { intakeCycleId: true, stage: true, interviewSlotId: true }
  })

  if (!application) return apiError('Application not found', 404)
  if (application.stage !== 'INTERVIEW_PENDING' && application.stage !== 'INTERVIEW_SCHEDULED') {
    return apiError('Not eligible for interview booking', 400)
  }

  // Get active schedules for this intake cycle (or global schedules if intakeCycleId is null)
  const schedules = await prismaUnfiltered.interviewSchedule.findMany({
    where: {
      isActive: true,
      endDate: { gte: new Date() },
      OR: [
        { intakeCycleId: application.intakeCycleId },
        { intakeCycleId: null }
      ]
    },
    include: {
      slots: {
        where: {
          date: { gte: new Date() } // Only future slots
        },
        orderBy: [
          { date: 'asc' },
          { startTime: 'asc' }
        ]
      }
    }
  })

  // Filter out full slots unless it's the applicant's current booked slot
  const availableSlots = schedules.flatMap(s => s.slots).filter(
    slot => (slot.bookedCount < slot.capacity) || (slot.id === application.interviewSlotId)
  )

  return apiSuccess({
    availableSlots,
    currentSlotId: application.interviewSlotId
  })
})
