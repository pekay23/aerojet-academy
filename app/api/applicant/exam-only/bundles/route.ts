import { NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth/helpers'
import { purchaseBundle, getUserBundles } from '@/lib/pools/bundles'
import prisma from '@/lib/prisma/client'
import { promoteApplicantToStudent } from '@/lib/enrollment/pathway'

export async function POST(request: Request) {
  try {
    const session = await getAuthSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const { bundleType, examComponentIds } = await request.json()

    if (!bundleType || !['TWO_SEAT', 'FOUR_SEAT'].includes(bundleType)) {
      return NextResponse.json(
        { error: 'Bundle type must be TWO_SEAT or FOUR_SEAT' },
        { status: 400 }
      )
    }

    if (!Array.isArray(examComponentIds)) {
      return NextResponse.json(
        { error: 'examComponentIds must be an array of selected module IDs' },
        { status: 400 }
      )
    }

    const requiredSeats = bundleType === 'TWO_SEAT' ? 2 : 4

    if (examComponentIds.length !== requiredSeats) {
      return NextResponse.json(
        {
          error: `You must select exactly ${requiredSeats} distinct modules for a ${bundleType === 'TWO_SEAT' ? 'Twin Pack' : '4-Pack'}.`,
        },
        { status: 400 }
      )
    }

    const uniqueModules = new Set(examComponentIds)
    if (uniqueModules.size !== requiredSeats) {
      return NextResponse.json(
        { error: 'Selected modules must be distinct (no duplicates allowed).' },
        { status: 400 }
      )
    }

    // --- Overshoot Validation ---
    // User requested: If the requested bundle overshoots the available seats in the upcoming Exam Event pools,
    // recommend a smaller bundle or individual seats.
    const activeEvent = await prisma.examEvent.findFirst({
      where: { status: { in: ['OPEN', 'DRAFT'] } },
      orderBy: { startDate: 'asc' },
    })

    if (activeEvent) {
      // Find pools in this event that are not full
      const openPools = await prisma.examPool.findMany({
        where: {
          eventId: activeEvent.id,
          status: { in: ['OPEN', 'NEAR_FULL', 'DRAFT'] },
          currentMemberCount: { lt: 28 },
        },
        select: { id: true, currentMemberCount: true },
      })

      // We will need at least `requiredSeats` across all pools or new pools.
      // EASA allows up to 28 candidates per pool. The absolute maximum pool capacity the system could fill
      // depends on the number of open pools. However, since the system creates new pools when needed,
      // we only block if the *overall physical limit* for the event is reached (very rare), OR
      // we can implement a soft check against current open pools.
      // Note: Because the system auto-spawns pools, we only strictly fail if we are hitting hard constraints
      // But per user request, we check if adding these seats would cause issues.
      // To strictly follow the prompt: predict if 4-pack overshoots total available seats in the current visible open pools.

      const totalAvailableOngoingSeats = openPools.reduce(
        (acc, pool) => acc + (28 - pool.currentMemberCount),
        0
      )

      // If we don't even have `requiredSeats` slots left across all open pools, and maybe we are near event capacity
      if (openPools.length > 0 && requiredSeats > totalAvailableOngoingSeats) {
        const suggestion =
          bundleType === 'FOUR_SEAT'
            ? 'try selecting a Twin Pack (2 modules) or booking Individual exam modules'
            : 'try booking Individual exam modules only'

        return NextResponse.json(
          {
            error: `Selecting this pack will overshoot the available seats for the upcoming exam event. Please ${suggestion}.`,
          },
          { status: 400 }
        )
      }
    }

    const result = await purchaseBundle(userId, bundleType, examComponentIds)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    let promotedToStudent = false
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

    await prisma.notification.create({
      data: {
        userId,
        title: 'Exam Package Purchased',
        message: `You have successfully purchased a ${bundleType === 'TWO_SEAT' ? 'Twin Pack' : '4-Pack'}.`,
        type: 'SUCCESS',
        linkUrl: '/student/wallet',
        linkText: 'View Wallet',
      },
    })

    return NextResponse.json({
      success: true,
      bundleId: result.bundleId,
      promotedToStudent,
      message: promotedToStudent
        ? `${bundleType === 'TWO_SEAT' ? '2-Seat' : '4-Seat'} bundle purchased and promoted to student!`
        : `${bundleType === 'TWO_SEAT' ? '2-Seat' : '4-Seat'} bundle purchased successfully!`,
    })
  } catch (error) {
    console.error('Error purchasing bundle:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const session = await getAuthSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const bundles = await getUserBundles(userId)

    return NextResponse.json({ bundles })
  } catch (error) {
    console.error('Error fetching bundles:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
