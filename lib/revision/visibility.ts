import { cache } from 'react'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { getStudentStatus } from '@/lib/access-control'

/**
 * Determines whether the "Revision Support" sidebar link should be visible
 * for a given student. Two conditions must BOTH be true:
 *
 * 1. **Exam Window**: The student has an upcoming exam/booking within:
 *    - 60 days for MODULAR students
 *    - 14 days for EXAM_ONLY students
 *    - Full-time students: always false
 *
 * 2. **Admin Availability**: There are active revision support runs (TuitionRun)
 *    with status 'OPEN' whose dates overlap with the relevant window.
 */
export const shouldShowRevisionSupport = cache(async (userId: string): Promise<boolean> => {
  const { isFullTime, isModular, isExamOnly } = await getStudentStatus(userId)

  // Full-time students never see revision support
  if (isFullTime) return false

  // Only modular and exam-only students qualify
  if (!isModular && !isExamOnly) return false

  const windowDays = isModular ? 60 : 14
  const windowDate = new Date()
  windowDate.setDate(windowDate.getDate() + windowDays)

  // Condition A: Does the student have an exam within the window?
  const upcomingBookingCount = await prismaUnfiltered.examBooking.count({
    where: {
      userId,
      status: { in: ['APPROVED', 'PENDING'] },
      examDate: {
        gte: new Date(),
        lte: windowDate,
      },
    },
  })

  // Also check pool memberships for upcoming events
  const upcomingPoolCount = await prismaUnfiltered.poolMembership.count({
    where: {
      userId,
      status: { in: ['RESERVED', 'CONFIRMED'] },
      pool: {
        event: {
          startDate: {
            gte: new Date(),
            lte: windowDate,
          },
        },
      },
    },
  })

  const hasUpcomingExam = upcomingBookingCount > 0 || upcomingPoolCount > 0
  if (!hasUpcomingExam) return false

  // Condition B: Are there open revision support runs available?
  const openRunCount = await prismaUnfiltered.tuitionRun.count({
    where: {
      status: 'OPEN',
      startDatetime: { gte: new Date() },
    },
  })

  return openRunCount > 0
})
