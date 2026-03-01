import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiError, apiNotFound, withErrorHandler } from '@/lib/api/response'
import { createAuditLog, AuditAction } from '@/lib/audit/logger'

// PATCH /api/staff/courses/[id]/exam-components/[componentId]
export const PATCH = withErrorHandler(
  async (req: NextRequest, context?: { params: Record<string, string> }) => {
    const staff = await requireStaff()
    const componentId = context?.params?.componentId
    if (!componentId) return apiError('Component ID required')

    const body = await req.json()
    const { name, duration, individualPrice, poolPrice } = body

    const component = await prisma.examComponent.findUnique({ where: { id: componentId } })
    if (!component) return apiNotFound('Exam component not found')

    const updated = await prisma.examComponent.update({
      where: { id: componentId },
      data: {
        ...(name !== undefined && { name }),
        ...(duration !== undefined && { duration: parseInt(duration) }),
        ...(individualPrice !== undefined && { individualPrice }),
        ...(poolPrice !== undefined && { poolPrice }),
      },
    })

    await createAuditLog({
      action: AuditAction.UPDATE,
      entity: 'ExamComponent',
      entityId: componentId,
      userId: staff.id,
      details: body,
    })

    return apiSuccess(updated)
  }
)

// DELETE /api/staff/courses/[id]/exam-components/[componentId]
export const DELETE = withErrorHandler(
  async (req: NextRequest, context?: { params: Record<string, string> }) => {
    const staff = await requireStaff()
    const componentId = context?.params?.componentId
    if (!componentId) return apiError('Component ID required')

    const component = await prisma.examComponent.findUnique({
      where: { id: componentId },
      include: { _count: { select: { exams: true, bookings: true } } },
    })
    if (!component) return apiNotFound('Exam component not found')

    if (component._count.exams > 0 || component._count.bookings > 0) {
      return apiError('Cannot delete exam component that has exams or bookings')
    }

    await prisma.examComponent.delete({ where: { id: componentId } })

    await createAuditLog({
      action: AuditAction.DELETE,
      entity: 'ExamComponent',
      entityId: componentId,
      userId: staff.id,
      details: { code: component.code },
    })

    return apiSuccess({ message: 'Exam component deleted' })
  }
)
