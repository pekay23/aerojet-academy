import { NextResponse } from 'next/server'
import { requireApplicant } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { joinPool } from '@/lib/pools/join'
import { bookStandaloneExam } from '@/lib/enrollment/exams'
import { promoteIfFirstExamActivity } from '@/lib/enrollment/pathway'
import { categoryMatchesTarget, getStudentTargetCategoryCodes } from '@/lib/easa/category-selection'
import { apiError, withErrorHandler } from '@/lib/api/response'

export const POST = withErrorHandler(async (request: Request) => {
  const user = await requireApplicant()

  const { examComponentId, bookingType = 'POOL' } = await request.json()

  if (!examComponentId) {
    return apiError('Exam component ID is required', 400)
  }

  // Load admin-editable pricing
  const { getExamPricingConfig } = await import('@/lib/pools/pricing-config')
  const pricingConfig = await getExamPricingConfig()

  const isIndividual = bookingType === 'INDIVIDUAL'
  const poolPrice = pricingConfig.poolExamFee
  const individualPrice = pricingConfig.individualExamFee

  // Check for active bundle first
  let activeBundle = null
  if (isIndividual) {
    const bundles = await prismaUnfiltered.examBundle.findMany({
      where: { userId: user.id, status: 'ACTIVE' },
      orderBy: { createdAt: 'asc' },
    })
    activeBundle = bundles.find((b) => b.usedSeats < b.totalSeats) || null
  }

  const depositAmount = isIndividual ? (activeBundle ? 0 : individualPrice) : 0
  const requiredAmount = isIndividual ? depositAmount : poolPrice

  const examComponent = await prismaUnfiltered.examComponent.findUnique({
    where: { id: examComponentId },
    include: { course: true },
  })

  if (!examComponent) {
    return apiError('Exam component not found', 404)
  }

  const targetCategories = await getStudentTargetCategoryCodes(prismaUnfiltered, user.id)
  if (targetCategories.length > 0 && !categoryMatchesTarget(examComponent.categoryCode, targetCategories)) {
    return apiError(
      `This exam component is not available for your selected licence category.`,
      403
    )
  }

  // Check wallet balance upfront (fast-fail for UX)
  if (requiredAmount > 0) {
    const wallet = await prismaUnfiltered.wallet.findUnique({ where: { userId: user.id } })
    if (!wallet || Number(wallet.availableBalance) < requiredAmount) {
      return NextResponse.json(
        {
          error: 'INSUFFICIENT_BALANCE',
          required: requiredAmount,
          available: Number(wallet?.availableBalance || 0),
        },
        { status: 400 }
      )
    }
  }

  // ====================================================================
  // INDIVIDUAL BOOKING (€520 — guaranteed seat, atomic transaction)
  // ====================================================================
  if (isIndividual) {
    let examEvent = await prismaUnfiltered.examEvent.findFirst({
      where: { status: { in: ['OPEN', 'DRAFT'] } },
      orderBy: { startDate: 'asc' },
    })

    if (!examEvent) {
      const futureDate = new Date()
      futureDate.setMonth(futureDate.getMonth() + 3)
      examEvent = await prismaUnfiltered.examEvent.create({
        data: {
          name: `Exam Event ${futureDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
          startDate: futureDate,
          endDate: new Date(futureDate.getTime() + 2 * 24 * 60 * 60 * 1000),
          paymentDeadline: new Date(futureDate.getTime() - 21 * 24 * 60 * 60 * 1000),
          status: 'OPEN',
        },
      })
    }

    const bookingResult = await bookStandaloneExam(user.id, {
      examComponentId: examComponent.id,
      eventId: examEvent.id,
    })

    const booking = await prismaUnfiltered.examBooking.findUnique({
      where: { id: bookingResult.bookingId },
    })

    if (!booking) {
      return apiError('Booking record was not created', 500)
    }

    const promotedToStudent = await promoteIfFirstExamActivity(user.id)

    return NextResponse.json({
      success: true,
      bookingId: booking.id,
      message: promotedToStudent
        ? 'Individual exam booked and promoted to student!'
        : 'Individual exam booked successfully!',
      promotedToStudent,
      booking: {
        id: booking.id,
        type: 'INDIVIDUAL',
        amountPaid: Number(booking.amountPaid),
        status: booking.status,
      },
      usedBundle: bookingResult.usedBundle,
    })
  }

  // ====================================================================
  // POOL BOOKING (€300 — joins a pool, uses atomic joinPool)
  // ====================================================================
  const moduleCode = examComponent.course.code

  // Find active exam event
  let examEvent = await prismaUnfiltered.examEvent.findFirst({
    where: { status: { in: ['OPEN', 'DRAFT'] } },
    orderBy: { startDate: 'asc' },
  })

  if (!examEvent) {
    const futureDate = new Date()
    futureDate.setMonth(futureDate.getMonth() + 3)
    examEvent = await prismaUnfiltered.examEvent.create({
      data: {
        name: `Exam Event ${futureDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
        startDate: futureDate,
        endDate: new Date(futureDate.getTime() + 2 * 24 * 60 * 60 * 1000),
        paymentDeadline: new Date(futureDate.getTime() - 21 * 24 * 60 * 60 * 1000),
        status: 'OPEN',
      },
    })
  }

  // Find an existing STANDARD pool for this event, or create the standard set
  let pool = await prismaUnfiltered.examPool.findFirst({
    where: {
      eventId: examEvent.id,
      poolType: 'STANDARD',
      status: { in: ['OPEN', 'NEAR_FULL', 'DRAFT'] },
      currentMemberCount: { lt: 28 },
    },
    orderBy: { currentMemberCount: 'desc' },
  })

  if (!pool) {
    const { createStandardPools } = await import('@/lib/pools/standard-pools')
    const created = await createStandardPools(examEvent.id)
    pool = created[0] ?? null
  }

  if (!pool) {
    return apiError('No available exam pool for this event', 500)
  }

  // Delegate entirely to the canonical joinPool path.
  const joinResult = await joinPool({
    poolId: pool.id,
    userId: user.id,
    examComponentId,
    eventId: examEvent.id,
    moduleCode,
    reserveAmount: poolPrice,
    amountPaid: poolPrice,
  })

  if (!joinResult.success) {
    return apiError(joinResult.error || 'Failed to join pool', 400)
  }

  const promotedToStudent = await promoteIfFirstExamActivity(user.id)

  const assignedPoolId = joinResult.pool?.id || pool.id
  const assignedPoolName = joinResult.pool?.name || pool.name
  const updatedPool = await prismaUnfiltered.examPool.findUnique({ where: { id: assignedPoolId } })

  return NextResponse.json({
    success: true,
    bookingId: joinResult.booking?.id,
    membershipId: joinResult.membership?.id,
    autoConfirmed: joinResult.autoConfirmed,
    message: promotedToStudent
      ? 'Joined booking and promoted to student!'
      : joinResult.autoConfirmed
        ? `Joined ${pool.name} — booking has been confirmed!`
        : `Joined booking (${pool.name}) with ${updatedPool?.currentMemberCount || 1}/28 candidates`,
    promotedToStudent,
    pool: {
      id: assignedPoolId,
      name: assignedPoolName,
      memberCount: updatedPool?.currentMemberCount || 1,
      status: updatedPool?.status,
    },
  })
})
