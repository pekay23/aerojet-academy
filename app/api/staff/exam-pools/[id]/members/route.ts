import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { requireStaff } from '@/lib/auth/helpers'
import { apiCreated, apiError, withErrorHandler } from '@/lib/api/response'
import { z } from 'zod'
import { validateBody } from '@/lib/validation/schemas'
import { createAuditLog, AuditAction } from '@/lib/audit/logger'
import { MembershipStatus } from '@prisma/client'

const addMemberSchema = z.object({
  userId: z.string().cuid(),
  examComponentId: z.string().cuid(),
})

interface RouteParams {
  params: { id: string }
}

export const POST = withErrorHandler(async (req: NextRequest, { params }: RouteParams) => {
  const staff = await requireStaff()
  const body = await req.json()
  const validation = validateBody(addMemberSchema, body)

  if (validation.success === false) return apiError((validation as any).error)

  const { userId, examComponentId } = validation.data
  const poolId = params.id

  // 1. Check pool exists
  const pool = await prisma.examPool.findUnique({
    where: { id: poolId },
  })

  if (!pool) return apiError('Pool not found', 404)

  // 2. Validate constraints
  if (pool.currentMemberCount >= pool.maxCandidates) {
    return apiError('Pool is full', 400)
  }

  // Verify the exam component belongs to an allowed module
  const examComponent = await prisma.examComponent.findUnique({
    where: { id: examComponentId },
    include: { course: { select: { code: true } } },
  })
  if (!examComponent) return apiError('Exam component not found', 404)
  if (pool.allowedModules.length > 0 && !pool.allowedModules.includes(examComponent.course.code)) {
    return apiError(`Module ${examComponent.course.code} is not allowed in this pool`, 400)
  }

  // 3. Check if user is already in the pool
  const existingMembership = await prisma.poolMembership.findUnique({
    where: { poolId_userId: { poolId, userId } },
  })

  if (existingMembership) {
    return apiError('User is already a member of this pool', 400)
  }

  // 4. Create membership
  const membership = await prisma.poolMembership.create({
    data: {
      poolId,
      userId,
      examComponentId,
      status: MembershipStatus.RESERVED,
      amountReserved: pool.seatPrice,
    },
  })

  // 5. Update pool count
  await prisma.examPool.update({
    where: { id: poolId },
    data: { currentMemberCount: { increment: 1 } },
  })

  await createAuditLog({
    action: AuditAction.CREATE,
    entity: 'PoolMembership',
    entityId: membership.id,
    userId: staff.id,
    details: { poolId, userId, examComponentId, moduleCode: examComponent.course.code },
  })

  return apiCreated(membership)
})
