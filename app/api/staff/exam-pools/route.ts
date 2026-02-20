import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { requireStaff } from '@/lib/auth/helpers'
import { apiCreated, apiError, withErrorHandler } from '@/lib/api/response'
import { createExamPoolSchema, validateBody } from '@/lib/validation/schemas'
import { createAuditLog, AuditAction } from '@/lib/audit/logger'

export const POST = withErrorHandler(async (req: NextRequest) => {
  const staff = await requireStaff()
  const body = await req.json()
  const validation = validateBody(createExamPoolSchema, body)

  if (validation.success === false) return apiError((validation as any).error)

  // Verify event exists
  const event = await prisma.examEvent.findUnique({
    where: { id: validation.data.eventId },
  })

  if (!event) {
    return apiError('Exam event not found', 404)
  }

  // Check for duplicate pool name in event
  const existingPool = await prisma.examPool.findFirst({
    where: {
      eventId: validation.data.eventId,
      name: validation.data.name,
    },
  })

  if (existingPool) {
    return apiError('Exam pool with this name already exists in this event', 409)
  }

  const pool = await prisma.examPool.create({
    data: validation.data as any,
  })

  await createAuditLog({
    action: AuditAction.CREATE,
    entity: 'ExamPool',
    entityId: pool.id,
    userId: staff.id,
  })

  return apiCreated(pool)
})

