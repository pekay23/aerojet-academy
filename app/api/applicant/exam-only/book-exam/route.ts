import { NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth/helpers'
import prisma from '@/lib/prisma/client'
import { joinPool } from '@/lib/pools/join'
import { bookStandaloneExam } from '@/lib/enrollment/exams'
import { promoteIfFirstExamActivity } from '@/lib/enrollment/pathway'

export async function POST(request: Request) {
  try {
    const session = await getAuthSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const { examComponentId, bookingType = 'POOL' } = await request.json()

    if (!examComponentId) {
      return NextResponse.json({ error: 'Exam component ID is required' }, { status: 400 })
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
      const bundles = await prisma.examBundle.findMany({
        where: { userId, status: 'ACTIVE' },
        orderBy: { createdAt: 'asc' },
      })
      activeBundle = bundles.find((b) => b.usedSeats < b.totalSeats) || null
    }

    const depositAmount = isIndividual ? (activeBundle ? 0 : individualPrice) : 0
    const requiredAmount = isIndividual ? depositAmount : poolPrice

    const examComponent = await prisma.examComponent.findUnique({
      where: { id: examComponentId },
      include: { course: true },
    })

    if (!examComponent) {
      return NextResponse.json({ error: 'Exam component not found' }, { status: 404 })
    }

    // Check wallet balance upfront (fast-fail for UX)
    if (requiredAmount > 0) {
      const wallet = await prisma.wallet.findUnique({ where: { userId } })
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
      let examEvent = await prisma.examEvent.findFirst({
        where: { status: { in: ['OPEN', 'DRAFT'] } },
        orderBy: { startDate: 'asc' },
      })

      if (!examEvent) {
        const futureDate = new Date()
        futureDate.setMonth(futureDate.getMonth() + 3)
        examEvent = await prisma.examEvent.create({
          data: {
            name: `Exam Event ${futureDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
            startDate: futureDate,
            endDate: new Date(futureDate.getTime() + 2 * 24 * 60 * 60 * 1000),
            paymentDeadline: new Date(futureDate.getTime() - 21 * 24 * 60 * 60 * 1000),
            status: 'OPEN',
          },
        })
      }

      const bookingResult = await bookStandaloneExam(userId, {
        moduleCode: examComponent.course.code,
        eventId: examEvent.id,
      })

      const booking = await prisma.examBooking.findUnique({
        where: { id: bookingResult.bookingId },
      })

      if (!booking) {
        return NextResponse.json({ error: 'Booking record was not created' }, { status: 500 })
      }

      const promotedToStudent = await promoteIfFirstExamActivity(userId)

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
    let examEvent = await prisma.examEvent.findFirst({
      where: { status: { in: ['OPEN', 'DRAFT'] } },
      orderBy: { startDate: 'asc' },
    })

    if (!examEvent) {
      const futureDate = new Date()
      futureDate.setMonth(futureDate.getMonth() + 3)
      examEvent = await prisma.examEvent.create({
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
    let pool = await prisma.examPool.findFirst({
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
      return NextResponse.json({ error: 'No available exam pool for this event' }, { status: 500 })
    }

    // Delegate entirely to the canonical joinPool path.
    // joinPoolInternal handles duplicate detection, time-conflict checks,
    // and resolveStandardPoolForJoin to pick the optimal pool for the module.
    const joinResult = await joinPool({
      poolId: pool.id,
      userId,
      examComponentId,
      eventId: examEvent.id,
      moduleCode,
      reserveAmount: poolPrice,
      amountPaid: poolPrice,
    })

    if (!joinResult.success) {
      return NextResponse.json({ error: joinResult.error }, { status: 400 })
    }

    const promotedToStudent = await promoteIfFirstExamActivity(userId)

    const assignedPoolId = joinResult.pool?.id || pool.id
    const assignedPoolName = joinResult.pool?.name || pool.name
    const updatedPool = await prisma.examPool.findUnique({ where: { id: assignedPoolId } })

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
  } catch (error) {
    console.error('Error booking exam:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
