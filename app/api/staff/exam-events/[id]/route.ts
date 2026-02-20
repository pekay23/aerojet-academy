import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { requireStaff } from '@/lib/auth/helpers'
import { apiError, apiSuccess, withErrorHandler } from '@/lib/api/response'
import { updateExamEventSchema, validateBody } from '@/lib/validation/schemas'
import { createAuditLog, AuditAction } from '@/lib/audit/logger'

interface RouteParams {
  params: { id: string }
}

export const PUT = withErrorHandler(async (req: NextRequest, { params }: RouteParams) => {
  const staff = await requireStaff()
  const body = await req.json()
  const validation = validateBody(updateExamEventSchema, body)

  if (validation.success === false) return apiError((validation as any).error)

  const existingEvent = await prisma.examEvent.findUnique({
    where: { id: params.id },
  })

  if (!existingEvent) {
    return apiError('Exam event not found', 404)
  }

  const updatedEvent = await prisma.examEvent.update({
    where: { id: params.id },
    data: validation.data as any,
  })

  await createAuditLog({
    action: AuditAction.UPDATE,
    entity: 'ExamEvent',
    entityId: updatedEvent.id,
    userId: staff.id,
    details: { changes: validation.data },
  })

  return apiSuccess(updatedEvent)
})

export const DELETE = withErrorHandler(async (req: NextRequest, { params }: RouteParams) => {
  const staff = await requireStaff()

  const existingEvent = await prisma.examEvent.findUnique({
    where: { id: params.id },
    include: { _count: { select: { pools: true, examBookings: true } } },
  })

  if (!existingEvent) {
    return apiError('Exam event not found', 404)
  }

  if (existingEvent._count.pools > 0 || existingEvent._count.examBookings > 0) {
    return apiError('Cannot delete event with existing pools or bookings', 400)
  }

  await prisma.examEvent.delete({
    where: { id: params.id },
  })

  await createAuditLog({
    action: AuditAction.DELETE,
    entity: 'ExamEvent',
    entityId: params.id,
    userId: staff.id,
  })

  return apiSuccess({ success: true })
})
