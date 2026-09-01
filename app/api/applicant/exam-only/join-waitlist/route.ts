import { NextResponse } from 'next/server'
import { requireApplicant } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { joinWaitlist } from '@/lib/pools/waitlist'
import { categoryMatchesTarget, getStudentTargetCategoryCodes } from '@/lib/easa/category-selection'
import { apiError, withErrorHandler } from '@/lib/api/response'

export const POST = withErrorHandler(async (req: Request) => {
  const user = await requireApplicant()

  const { poolId, moduleCode } = await req.json()

  if (!poolId || !moduleCode) {
    return apiError('Missing poolId or moduleCode', 400)
  }

  // Find the exam component ID from the module code
  const component = await prismaUnfiltered.examComponent.findUnique({
    where: { code: moduleCode },
    select: { id: true, categoryCode: true },
  })

  if (!component) {
    return apiError('Invalid module code', 400)
  }

  const targetCategories = await getStudentTargetCategoryCodes(prismaUnfiltered, user.id)
  if (targetCategories.length > 0 && !categoryMatchesTarget(component.categoryCode, targetCategories)) {
    return apiError('This module/category is not part of your selected licence pathway.', 403)
  }

  const result = await joinWaitlist(poolId, user.id, component.id)

  if (!result.success) {
    return apiError(result.error || 'Failed to join waitlist', 400)
  }

  return NextResponse.json({ success: true, entry: result.entry })
})
