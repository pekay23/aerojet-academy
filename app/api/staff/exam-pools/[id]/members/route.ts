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

export const POST = withErrorHandler(
  async (req: NextRequest, ctx?: { params: Record<string, string> }) => {
    const params = ctx?.params ?? {}
    const staff = await requireStaff()
    const body = await req.json()
    const validation = validateBody(addMemberSchema, body)

    if (validation.success === false) return apiError(validation.error)

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

    // Verify the exam component belongs to an allowed module, or check diversity cap
    const examComponent = await prisma.examComponent.findUnique({
      where: { id: examComponentId },
      include: { course: { select: { code: true } } },
    })
    if (!examComponent) return apiError('Exam component not found', 404)

    const requestedModuleCode = examComponent.course.code
    let newAllowedModules = [...pool.allowedModules]

    // If the pool has a restricted module list and this module isn't in it:
    if (pool.allowedModules.length > 0 && !pool.allowedModules.includes(requestedModuleCode)) {
      // Determine maximum allowed diversity
      if (pool.allowedModules.length >= 4) {
        return apiError(
          `Pool already has reached the maximum of 4 modules (${pool.allowedModules.join(', ')}). Cannot add ${requestedModuleCode}.`,
          400
        )
      }
      // Otherwise, append the new module to the allowed pool modules list
      newAllowedModules.push(requestedModuleCode)
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

    // 5. Update pool count and optionally allowedModules
    await prisma.examPool.update({
      where: { id: poolId },
      data: {
        currentMemberCount: { increment: 1 },
        allowedModules: newAllowedModules,
      },
    })

    await createAuditLog({
      action: AuditAction.CREATE,
      entity: 'PoolMembership',
      entityId: membership.id,
      userId: staff.id,
      description: `Added member to pool "${pool.name}" for module ${examComponent.course.code}`,
      details: { poolId, userId, examComponentId, moduleCode: examComponent.course.code },
    })

    return apiCreated(membership)
  }
)
