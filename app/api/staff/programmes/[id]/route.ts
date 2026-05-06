import { NextRequest } from 'next/server'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiError, apiNotFound, withErrorHandler } from '@/lib/api/response'
import { createAuditLog, AuditAction } from '@/lib/audit/logger'

// GET /api/staff/programmes/[id]
export const GET = withErrorHandler(
  async (req: NextRequest, context?: { params: Record<string, string> }) => {
    await requireStaff()
    const id = context?.params?.id
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
  }
)

// PATCH /api/staff/programmes/[id]
export const PATCH = withErrorHandler(
  async (req: NextRequest, context?: { params: Record<string, string> }) => {
    const staff = await requireStaff()
    const id = context?.params?.id
    if (!id) return apiError('Programme ID required')

    const body = await req.json()
    const { name, totalFee, description, isActive } = body

    const programme = await prismaUnfiltered.fullTimeProgramme.findUnique({ where: { id } })
    if (!programme) return apiNotFound('Programme not found')

    const updated = await prismaUnfiltered.fullTimeProgramme.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(totalFee !== undefined && { totalFee: parseFloat(totalFee) }),
        ...(description !== undefined && { description }),
        ...(isActive !== undefined && { isActive }),
      },
    })

    await createAuditLog({
      action: AuditAction.UPDATE,
      entity: 'FullTimeProgramme',
      entityId: id,
      userId: staff.id,
      details: body,
    })

    return apiSuccess(updated)
  }
)
