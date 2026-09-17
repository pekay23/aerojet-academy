import { NextResponse } from 'next/server'
import { requireApplicant } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { joinPool } from '@/lib/pools/join'
import type { PoolJoinResult } from '@/lib/pools/types'
import { validatePoolJoin } from '@/lib/pools/validation'
import { promoteIfFirstExamActivity } from '@/lib/enrollment/pathway'
import { categoryMatchesTarget, getStudentTargetCategoryCodes } from '@/lib/easa/category-selection'
import { apiError, withErrorHandler } from '@/lib/api/response'

export const POST = withErrorHandler(async (request: Request) => {
  const user = await requireApplicant()

  const { poolId, moduleCode } = await request.json()

  if (!poolId || !moduleCode) {
    return apiError('Pool ID and module code are required', 400)
  }

  // Resolve exam component from module code
  const examComponent = await prismaUnfiltered.examComponent.findFirst({
    where: {
      code: moduleCode,
    },
    include: { course: true },
  })

  if (!examComponent) {
    return apiError(`No exam component found for module ${moduleCode}`, 404)
  }

  const targetCategories = await getStudentTargetCategoryCodes(prismaUnfiltered, user.id)
  if (targetCategories.length > 0 && !categoryMatchesTarget(examComponent.categoryCode, targetCategories)) {
    return apiError('This module/category is not part of your selected licence pathway.', 403)
  }

  // Pre-validate before entering the transaction (fast-fail for UX)
  const validation = await validatePoolJoin(poolId, user.id, examComponent.id)
  if (!validation.valid) {
    if (validation.error?.includes('Insufficient')) {
      const pool = await prismaUnfiltered.examPool.findUnique({ where: { id: poolId } })
      const wallet = await prismaUnfiltered.wallet.findUnique({ where: { userId: user.id } })
      return NextResponse.json(
        {
          error: 'INSUFFICIENT_BALANCE',
          required: Number(pool?.seatPrice || 300),
          available: Number(wallet?.availableBalance || 0),
        },
        { status: 400 }
      )
    }
    return apiError(validation.error || 'Validation failed', 400)
  }

  // Use the atomic joinPool function with serializable isolation
  const result = (await joinPool({
    poolId,
    userId: user.id,
    examComponentId: examComponent.id,
    moduleCode: examComponent.course.code,
  })) as PoolJoinResult

  if (!result.success) {
    if (result.error?.includes('Insufficient') || result.error?.includes('balance')) {
      return NextResponse.json(
        { error: 'INSUFFICIENT_BALANCE', message: result.error },
        { status: 400 }
      )
    }
    return apiError(result.error || 'Failed to join pool', 400)
  }

  const promotedToStudent = await promoteIfFirstExamActivity(user.id)

  return NextResponse.json({
    success: true,
    membershipId: result.membership?.id,
    autoConfirmed: result.autoConfirmed,
    message: promotedToStudent
      ? 'Successfully joined booking and promoted to student!'
      : result.autoConfirmed
        ? 'Successfully joined booking — booking has been confirmed!'
        : 'Successfully joined booking',
    promotedToStudent,
    pool: result.pool,
  })
})
