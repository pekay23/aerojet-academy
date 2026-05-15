import prisma from '@/lib/prisma/client'
import { categoryMatchesTarget } from '@/lib/easa/category-selection'
import { EASA_PASSING_GRADE } from '@/lib/utils/grading'
import type { BookingType } from '@prisma/client'

function generateCombinedGroupRef(): string {
  return `COMBINED_${crypto.randomUUID()}`
}

/**
 * Get the MCQ and essay components for a combined-exam course and category.
 * M7, M9, and M10 have separate MCQ/essay components under the same course.
 */
export async function getCombinedComponents(courseId: string, categoryCode?: string | null) {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: {
      id: true,
      hasCombinedExam: true,
      code: true,
      examComponents: {
        select: {
          id: true,
          code: true,
          name: true,
          type: true,
          courseId: true,
          categoryCode: true,
        },
      },
    },
  })

  if (!course || !course.hasCombinedExam) return null

  const compatible = categoryCode
    ? course.examComponents.filter((component) => categoryMatchesTarget(component.categoryCode, [categoryCode]))
    : course.examComponents

  const mcq = compatible.find((component) => component.type === 'MCQ')
  const essay =
    compatible.find((component) => component.type === 'ESSAY' && component.categoryCode === mcq?.categoryCode) ??
    compatible.find((component) => component.type === 'ESSAY')

  if (!mcq || !essay) return null

  return { mcq, essay, courseId: course.id, moduleCode: course.code }
}

/**
 * Book both MCQ and essay components together.
 * The first booking carries the payment; the linked essay booking is zero-value.
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
  categoryCode?: string | null
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
    categoryCode,
  } = params

  const components = await getCombinedComponents(courseId, categoryCode)
  if (!components) {
    throw new Error(
      categoryCode
        ? `Course does not support combined exams or is missing MCQ/essay components for category ${categoryCode}.`
        : 'Course does not support combined exams or is missing MCQ/essay components.'
    )
  }

  const combinedGroupRef = generateCombinedGroupRef()

  return prisma.$transaction(async (tx) => {
    const commonData = {
      userId,
      courseId,
      eventId: eventId ?? undefined,
      bookingType,
      isResit,
      attemptType: attemptType ?? undefined,
      combinedGroupRef,
      moduleCode: components.moduleCode,
      status: 'APPROVED' as const,
    }

    const mcqBooking = await tx.examBooking.create({
      data: {
        ...commonData,
        examComponentId: components.mcq.id,
        walletTxnId: walletTxnId ?? undefined,
        amountPaid,
      },
    })

    const essayBooking = await tx.examBooking.create({
      data: {
        ...commonData,
        examComponentId: components.essay.id,
        amountPaid: 0,
      },
    })

    return { mcqBooking, essayBooking, combinedGroupRef }
  })
}

/**
 * Evaluate combined exam result.
 * Both MCQ and essay must have results and both must be >= 75% to pass.
 */
export async function evaluateCombinedResult(combinedGroupRef: string) {
  const bookings = await prisma.examBooking.findMany({
    where: { combinedGroupRef },
    include: {
      examComponent: { select: { id: true, type: true, name: true } },
    },
  })

  if (bookings.length !== 2) {
    throw new Error(`Expected 2 bookings for combined group ${combinedGroupRef}, found ${bookings.length}.`)
  }

  const mcqBooking = bookings.find((b) => b.examComponent?.type === 'MCQ')
  const essayBooking = bookings.find((b) => b.examComponent?.type === 'ESSAY')

  if (!mcqBooking || !essayBooking) {
    throw new Error('Combined group is missing MCQ or essay booking.')
  }

  const [mcqResult, essayResult] = await Promise.all([
    prisma.examResult.findFirst({ where: { examId: mcqBooking.examId ?? undefined }, orderBy: { createdAt: 'desc' } }),
    prisma.examResult.findFirst({ where: { examId: essayBooking.examId ?? undefined }, orderBy: { createdAt: 'desc' } }),
  ])

  const mcqPercentage = mcqResult?.percentage != null ? Number(mcqResult.percentage) : null
  const essayPercentage = essayResult?.percentage != null ? Number(essayResult.percentage) : null

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
    reason: `Failed component(s): ${failedComponents.join(', ')}. Both MCQ and essay must be re-sat.`,
    failedComponents,
    mcqBookingId: result.mcqBookingId,
    essayBookingId: result.essayBookingId,
  }
}
