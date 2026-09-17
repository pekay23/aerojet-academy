import { NextResponse } from 'next/server'
import { requireApplicant } from '@/lib/auth/helpers'
import { purchaseBundle, getUserBundles } from '@/lib/pools/bundles'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { promoteIfFirstExamActivity } from '@/lib/enrollment/pathway'
import { apiError, withErrorHandler } from '@/lib/api/response'

export const POST = withErrorHandler(async (request: Request) => {
  const user = await requireApplicant()

  const { bundleType, examComponentIds } = await request.json()

  if (!bundleType || !['TWO_SEAT', 'FOUR_SEAT'].includes(bundleType)) {
    return apiError('Bundle type must be TWO_SEAT or FOUR_SEAT', 400)
  }

  if (!Array.isArray(examComponentIds)) {
    return apiError('examComponentIds must be an array of selected module IDs', 400)
  }

  const requiredSeats = bundleType === 'TWO_SEAT' ? 2 : 4

  if (examComponentIds.length !== requiredSeats) {
    return apiError(
      `You must select exactly ${requiredSeats} distinct modules for a ${bundleType === 'TWO_SEAT' ? 'Twin Pack' : '4-Pack'}.`,
      400
    )
  }

  const uniqueModules = new Set(examComponentIds)
  if (uniqueModules.size !== requiredSeats) {
    return apiError('Selected modules must be distinct (no duplicates allowed).', 400)
  }

  // --- Overshoot Validation ---
  // User requested: If the requested bundle overshoots the available seats in the upcoming Exam Event pools,
  // recommend a smaller bundle or individual seats.
  const activeEvent = await prismaUnfiltered.examEvent.findFirst({
    where: { status: { in: ['OPEN', 'DRAFT'] } },
    orderBy: { startDate: 'asc' },
  })

  if (activeEvent) {
    const openPools = await prismaUnfiltered.examPool.findMany({
      where: {
        eventId: activeEvent.id,
        status: { in: ['OPEN', 'NEAR_FULL', 'DRAFT'] },
        currentMemberCount: { lt: 28 },
      },
      select: { id: true, currentMemberCount: true },
    })

    const totalAvailableOngoingSeats = openPools.reduce(
      (acc, pool) => acc + (28 - pool.currentMemberCount),
      0
    )

    if (openPools.length > 0 && requiredSeats > totalAvailableOngoingSeats) {
      const suggestion =
        bundleType === 'FOUR_SEAT'
          ? 'try selecting a Twin Pack (2 modules) or booking Individual exam modules'
          : 'try booking Individual exam modules only'

      return apiError(
        `Selecting this pack will overshoot the available seats for the upcoming exam event. Please ${suggestion}.`,
        400
      )
    }
  }

  const result = await purchaseBundle(user.id, bundleType, examComponentIds)

  if (!result.success) {
    return apiError(result.error || 'Failed to purchase bundle', 400)
  }

  const promotedToStudent = await promoteIfFirstExamActivity(user.id)

  await prismaUnfiltered.notification.create({
    data: {
      userId: user.id,
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
})

export const GET = withErrorHandler(async () => {
  const user = await requireApplicant()
  const bundles = await getUserBundles(user.id)
  return NextResponse.json({ bundles })
})
