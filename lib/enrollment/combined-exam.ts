import prisma from '@/lib/prisma/client'
import { EASA_PASSING_GRADE } from '@/lib/utils/grading'
import type { BookingType } from '@prisma/client'

function generateCombinedGroupRef(): string {
  return `COMBINED_${crypto.randomUUID()}`
}

/**
 * Get both MCQ and Essay components for a combined-exam course.
 * Returns null if course doesn't have hasCombinedExam or doesn't have both types.
 */
export async function getCombinedComponents(courseId: string) {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: {
      id: true,
      hasCombinedExam: true,
      examComponents: {
        select: {
          id: true,
          code: true,
          name: true,
          type: true,
          courseId: true,
        },
      },
    },
  })

  if (!course || !course.hasCombinedExam) return null

  const mcq = course.examComponents.find((c) => c.type === 'MCQ')
  const essay = course.examComponents.find((c) => c.type === 'ESSAY')

  if (!mcq || !essay) return null

  return { mcq, essay, courseId: course.id }
}

/**
 * Book both MCQ and Essay components together.
 * Creates two ExamBooking records linked by combinedGroupRef.
 * Only charges the fee once (second booking gets amountPaid: 0).
 * Returns both bookings.
 */
export async function bookCombinedExam(params: {
  userId: string
  courseId: string
  eventId?: string
  bookingType: BookingType
  walletTxnId?: string
  amountPaid: number
  isResit?: boolean
  attemptType?: string
}) {
  const {
    userId,
    courseId,
    eventId,
    bookingType,
    walletTxnId,
    amountPaid,
    isResit = false,
    attemptType,
  } = params

  const components = await getCombinedComponents(courseId)
  if (!components) {
    throw new Error(
      'Course does not support combined exams or is missing MCQ/Essay components.'
    )
  }

  const combinedGroupRef = generateCombinedGroupRef()

  return prisma.$transaction(async (tx) => {
    // First booking (MCQ) carries the payment
    const mcqBooking = await tx.examBooking.create({
      data: {
        userId,
        courseId,
        examComponentId: components.mcq.id,
        eventId: eventId ?? undefined,
        bookingType,
        walletTxnId: walletTxnId ?? undefined,
        amountPaid,
        isResit,
        attemptType: attemptType ?? undefined,
        combinedGroupRef,
        status: 'APPROVED',
      },
    })

    // Second booking (Essay) has amountPaid: 0 since fee was charged once
    const essayBooking = await tx.examBooking.create({
      data: {
        userId,
        courseId,
        examComponentId: components.essay.id,
        eventId: eventId ?? undefined,
        bookingType,
        amountPaid: 0,
        isResit,
        attemptType: attemptType ?? undefined,
        combinedGroupRef,
        status: 'APPROVED',
      },
    })

    return { mcqBooking, essayBooking, combinedGroupRef }
  })
}

/**
 * Evaluate combined exam result.
 * Both MCQ and Essay must have results and both must be >= 75% to pass.
 * Returns assessment of the combined result.
 */
export async function evaluateCombinedResult(combinedGroupRef: string) {
  const bookings = await prisma.examBooking.findMany({
    where: { combinedGroupRef },
    include: {
      examComponent: { select: { id: true, type: true, name: true } },
    },
  })

  if (bookings.length !== 2) {
    throw new Error(
      `Expected 2 bookings for combined group ${combinedGroupRef}, found ${bookings.length}.`
    )
  }

  const mcqBooking = bookings.find((b) => b.examComponent?.type === 'MCQ')
  const essayBooking = bookings.find((b) => b.examComponent?.type === 'ESSAY')

  if (!mcqBooking || !essayBooking) {
    throw new Error('Combined group is missing MCQ or Essay booking.')
  }

  const mcqPercentage = mcqBooking.percentage != null ? Number(mcqBooking.percentage) : null
  const essayPercentage = essayBooking.percentage != null ? Number(essayBooking.percentage) : null

  // Both must have results to evaluate
  if (mcqPercentage == null || essayPercentage == null) {
    return {
      complete: false,
      mcqPercentage,
      essayPercentage,
      passed: null,
      mcqPassed: mcqPercentage != null ? mcqPercentage >= EASA_PASSING_GRADE : null,
      essayPassed: essayPercentage != null ? essayPercentage >= EASA_PASSING_GRADE : null,
      requiresResit: null,
      mcqBookingId: mcqBooking.id,
      essayBookingId: essayBooking.id,
    }
  }

  const mcqPassed = mcqPercentage >= EASA_PASSING_GRADE
  const essayPassed = essayPercentage >= EASA_PASSING_GRADE
  const passed = mcqPassed && essayPassed

  return {
    complete: true,
    mcqPercentage,
    essayPercentage,
    passed,
    mcqPassed,
    essayPassed,
    requiresResit: !passed,
    mcqBookingId: mcqBooking.id,
    essayBookingId: essayBooking.id,
  }
}

/**
 * Check if a combined exam requires a resit.
 * If either component failed, both must be re-booked.
 */
export async function requiresCombinedResit(combinedGroupRef: string) {
  const result = await evaluateCombinedResult(combinedGroupRef)

  if (!result.complete) {
    return {
      determined: false,
      reason: 'Not all components have been graded yet.',
      mcqBookingId: result.mcqBookingId,
      essayBookingId: result.essayBookingId,
    }
  }

  if (result.passed) {
    return {
      determined: true,
      requiresResit: false,
      reason: 'Both components passed.',
      mcqBookingId: result.mcqBookingId,
      essayBookingId: result.essayBookingId,
    }
  }

  const failedComponents: string[] = []
  if (!result.mcqPassed) failedComponents.push('MCQ')
  if (!result.essayPassed) failedComponents.push('Essay')

  return {
    determined: true,
    requiresResit: true,
    reason: `Failed component(s): ${failedComponents.join(', ')}. Both MCQ and Essay must be re-sat.`,
    failedComponents,
    mcqBookingId: result.mcqBookingId,
    essayBookingId: result.essayBookingId,
  }
}
