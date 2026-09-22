import { NextRequest } from 'next/server'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { requireStaff } from '@/lib/auth/helpers'
import {
  apiSuccess,
  apiError,
  apiNotFound,
  withErrorHandler,
  RouteContext,
} from '@/lib/api/response'
import { createAuditLog, AuditAction } from '@/lib/audit/logger'

// GET /api/staff/programmes/[id]
export const GET = withErrorHandler(async (req: NextRequest, context?: RouteContext) => {
  await requireStaff()
  if (!context) return apiError('Context required')
  const params = await context.params
  const id = params.id
  if (!id) return apiError('Programme ID required')

  const programme = await prismaUnfiltered.fullTimeProgramme.findUnique({
    where: { id },
    include: {
      programmeYears: {
        orderBy: { yearNumber: 'asc' },
        include: { courses: { select: { id: true, code: true, name: true } } },
      },
      _count: { select: { enrollments: true } },
    },
  })

  if (!programme) return apiNotFound('Programme not found')
  return apiSuccess(programme)
})

// PATCH /api/staff/programmes/[id]
export const PATCH = withErrorHandler(async (req: NextRequest, context?: RouteContext) => {
  const staff = await requireStaff()
  if (!context) return apiError('Context required')
  const params = await context.params
  const id = params.id
  if (!id) return apiError('Programme ID required')

  const body = await req.json()
  const { name, totalFee, description, isActive } = body

  const programme = await prismaUnfiltered.fullTimeProgramme.findUnique({
    where: { id },
    include: { _count: { select: { enrollments: true } } },
  })
  if (!programme) return apiNotFound('Programme not found')

  if (isActive === false && programme._count.enrollments > 0) {
    return apiError(
      `Cannot deactivate: ${programme._count.enrollments} active enrollment(s) exist. Reassign or remove enrollments first.`,
      409
    )
  }

  const updated = await prismaUnfiltered.fullTimeProgramme.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(totalFee !== undefined && { totalFee: Number.parseFloat(totalFee) || 0 }),
      ...(description !== undefined && { description }),
      ...(isActive !== undefined && { isActive }),
    },
  })

  await createAuditLog({
    action: AuditAction.UPDATE,
    entity: 'FullTimeProgramme',
    entityId: id,
    userId: staff.id,
    description: `Updated programme: ${name || programme.name}`,
    changes: {
      before: { name: programme.name, totalFee: programme.totalFee, isActive: programme.isActive },
      after: { name, totalFee: Number.parseFloat(totalFee) || 0, isActive },
    },
  })

  return apiSuccess(updated)
})
