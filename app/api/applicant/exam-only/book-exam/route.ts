import { NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth/helpers'
import prisma from '@/lib/prisma/client'
import { Prisma } from '@prisma/client'
import { joinPool } from '@/lib/pools/join'
import { chargeWallet } from '@/lib/wallet/operations'
import { promoteApplicantToStudent } from '@/lib/enrollment/pathway'

export async function POST(request: Request) {
  try {
    const session = await getAuthSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
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
    const depositAmount = isIndividual ? individualPrice : 0
    const requiredAmount = isIndividual ? depositAmount : poolPrice

    const examComponent = await prisma.examComponent.findUnique({
      where: { id: examComponentId },
      include: { course: true },
    })

    if (!examComponent) {
      return NextResponse.json({ error: 'Exam component not found' }, { status: 404 })
    }

    // Check wallet balance upfront (fast-fail for UX)
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

    // ====================================================================
    // INDIVIDUAL BOOKING (€520 — guaranteed seat, atomic transaction)
    // ====================================================================
    if (isIndividual) {
      const booking = await prisma.$transaction(
        async (tx) => {
          // 1. Charge wallet atomically (handles balance + availableBalance)
          await chargeWallet(
            tx,
            userId,
            depositAmount,
            `Individual Exam Payment: ${examComponent.course.code} - ${examComponent.name}`,
            examComponentId,
            'EXAM_BOOKING'
          )

          // 2. Find or create exam event
          let examEvent = await tx.examEvent.findFirst({
            where: { status: { in: ['OPEN', 'DRAFT'] } },
            orderBy: { startDate: 'asc' },
          })

          if (!examEvent) {
            const futureDate = new Date()
            futureDate.setMonth(futureDate.getMonth() + 3)
            examEvent = await tx.examEvent.create({
              data: {
                name: `Exam Event ${futureDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
                startDate: futureDate,
                endDate: new Date(futureDate.getTime() + 2 * 24 * 60 * 60 * 1000),
                paymentDeadline: new Date(futureDate.getTime() - 21 * 24 * 60 * 60 * 1000),
                status: 'OPEN',
              },
            })
          }

          // 3. Create booking record
          const newBooking = await tx.examBooking.create({
            data: {
              userId,
              examComponentId,
              eventId: examEvent.id,
              bookingType: 'INDIVIDUAL',
              moduleCode: examComponent.course.code,
              amountPaid: depositAmount,
              status: 'PENDING',
              examDate: examEvent.startDate,
            },
          })

          return newBooking
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
      )

      // Promote to student (outside main tx for non-blocking)
      let promotedToStudent = false
      const existingExams = await prisma.examBooking.count({ where: { userId } })
      if (existingExams === 1) {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { role: true },
        })
        if (user && user.role === 'APPLICANT') {
          try {
            await promoteApplicantToStudent(userId, userId)
            promotedToStudent = true
          } catch (e) {
            console.error('Promotion failed:', e)
          }
        }
      }

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
          amountPaid: depositAmount,
          status: booking.status,
        },
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

    // Find available pool or create new one
    let pool = await prisma.examPool.findFirst({
      where: {
        eventId: examEvent.id,
        status: { in: ['OPEN', 'NEAR_FULL', 'DRAFT'] },
        currentMemberCount: { lt: 28 },
      },
      orderBy: { currentMemberCount: 'desc' },
    })

    if (!pool) {
      const poolDate = examEvent.startDate || new Date()
      const startTime = new Date(poolDate)
      startTime.setHours(9, 0, 0, 0)
      const endTime = new Date(poolDate)
      endTime.setHours(12, 0, 0, 0)

      pool = await prisma.examPool.create({
        data: {
          eventId: examEvent.id,
          name: `Pool ${new Date().getTime().toString().slice(-4)}`,
          examDate: poolDate,
          examStartTime: startTime,
          examEndTime: endTime,
          status: 'OPEN',
          seatPrice: 300,
          allowedModules: [moduleCode],
          preSeedModules: [moduleCode],
        },
      })
    }

    // Check for existing membership in this pool
    const existingMembership = await prisma.poolMembership.findFirst({
      where: { poolId: pool.id, userId },
    })
    if (existingMembership) {
      return NextResponse.json({ error: 'You are already a member of this pool' }, { status: 400 })
    }

    // Use the atomic joinPool function
    const joinResult = await joinPool({
      poolId: pool.id,
      userId,
      examComponentId,
      eventId: examEvent.id,
      moduleCode,
      amountPaid: poolPrice,
    })

    if (!joinResult.success) {
      return NextResponse.json({ error: joinResult.error }, { status: 400 })
    }

    // Promote to student if first booking
    const existingMemberships = await prisma.poolMembership.count({ where: { userId } })
    const existingExams = await prisma.examBooking.count({ where: { userId } })

    let promotedToStudent = false
    if (existingMemberships >= 1 && existingExams === 1) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      })
      if (user && user.role === 'APPLICANT') {
        try {
          await promoteApplicantToStudent(userId, userId)
          promotedToStudent = true
        } catch (e) {
          console.error('Promotion failed:', e)
        }
      }
    }

    const updatedPool = await prisma.examPool.findUnique({ where: { id: pool.id } })

    return NextResponse.json({
      success: true,
      bookingId: joinResult.booking?.id,
      membershipId: joinResult.membership?.id,
      autoConfirmed: joinResult.autoConfirmed,
      message: promotedToStudent
        ? 'Joined pool and promoted to student!'
        : joinResult.autoConfirmed
          ? `Joined ${pool.name} — pool has been confirmed!`
          : `Joined pool (${pool.name}) with ${updatedPool?.currentMemberCount || 1}/28 candidates`,
      promotedToStudent,
      pool: {
        id: pool.id,
        name: pool.name,
        memberCount: updatedPool?.currentMemberCount || 1,
        status: updatedPool?.status,
      },
    })
  } catch (error) {
    console.error('Error booking exam:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
