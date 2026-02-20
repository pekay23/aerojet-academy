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
  selectedModule: z.string().min(1),
})

interface RouteParams {
  params: { id: string }
}

export const POST = withErrorHandler(async (req: NextRequest, { params }: RouteParams) => {
  const staff = await requireStaff()
  const body = await req.json()
  const validation = validateBody(addMemberSchema, body)

  if (validation.success === false) return apiError((validation as any).error)

  const { userId, selectedModule } = validation.data
  const poolId = params.id

  // 1. Check if pool exists and retrieve details
  const pool = await prisma.examPool.findUnique({
    where: { id: poolId },
    include: { memberships: true },
  })

  if (!pool) return apiError('Pool not found', 404)

  // 2. valiate constraints
  if (pool.currentMemberCount >= pool.maxCandidates) {
    return apiError('Pool is full', 400)
  }

  if (!pool.allowedModules.includes(selectedModule)) {
    return apiError(`Module ${selectedModule} is not allowed in this pool`, 400)
  }

  // 3. Check if user is already in the pool
  const existingMembership = await prisma.poolMembership.findUnique({
    where: {
      poolId_userId: {
        poolId,
        userId,
      },
    },
  })

  if (existingMembership) {
    return apiError('User is already a member of this pool', 400)
  }

  // 4. Create membership
  // Note: We are not handling payment here, passing amountReserved as 0 or handled elsewhere?
  // Schema says amountReserved is Decimal.
  // We should ideally fetch the seatPrice from the pool.

  const membership = await prisma.poolMembership.create({
    data: {
      poolId,
      userId,
      selectedModule,
      status: MembershipStatus.RESERVED, // Or CONFIRMED if manual? Let's say RESERVED.
      amountReserved: pool.seatPrice,
      // We might want to check if they have balance, but for manual add by staff, maybe we override or just set it.
      // For now, simple add.
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
    details: { poolId, userId, selectedModule },
  })

  return apiCreated(membership)
})
