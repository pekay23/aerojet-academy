import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { requireStaff } from '@/lib/auth/helpers'
import { apiError, apiSuccess, withErrorHandler } from '@/lib/api/response'
import { updateExamEventSchema, validateBody } from '@/lib/validation/schemas'
import { softDeleteData } from '@/lib/prisma/soft-delete'
import { createAuditLog, AuditAction } from '@/lib/audit/logger'

export const PUT = withErrorHandler(
  async (req: NextRequest, ctx?: { params: Record<string, string> }) => {
    const staff = await requireStaff()
    const id = ctx?.params?.id
    const body = await req.json()
    const validation = validateBody(updateExamEventSchema, body)

    if (validation.success === false) return apiError(validation.error)

    const existingEvent = await prisma.examEvent.findUnique({
      where: { id },
    })

    if (!existingEvent) {
      return apiError('Exam event not found', 404)
    }

    const updatedEvent = await prisma.examEvent.update({
      where: { id },
      data: validation.data,
    })

    await createAuditLog({
      action: AuditAction.UPDATE,
      entity: 'ExamEvent',
      entityId: updatedEvent.id,
      userId: staff.id,
      description: `Updated exam event "${existingEvent.name}"`,
      details: { changes: validation.data },
    })

    return apiSuccess(updatedEvent)
  }
)

export const DELETE = withErrorHandler(
  async (req: NextRequest, ctx?: { params: Record<string, string> }) => {
    const staff = await requireStaff()
    const id = ctx?.params?.id

    const existingEvent = await prisma.examEvent.findUnique({
      where: { id },
      include: { _count: { select: { pools: true, examBookings: true } } },
    })

    if (!existingEvent) {
      return apiError('Exam event not found', 404)
    }

    if (existingEvent._count.pools > 0 || existingEvent._count.examBookings > 0) {
      return apiError('Cannot delete event with existing pools or bookings', 400)
    }

    await prisma.examEvent.update({
      where: { id },
      data: softDeleteData(),
    })

    await createAuditLog({
      action: AuditAction.DELETE,
      entity: 'ExamEvent',
      entityId: id,
      userId: staff.id,
      description: `Deleted exam event "${existingEvent.name}"`,
    })

    return apiSuccess({ success: true })
  }
)
