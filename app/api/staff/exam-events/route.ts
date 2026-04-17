import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { requireStaff } from '@/lib/auth/helpers'
import { createAuditLog, AuditAction } from '@/lib/audit/logger'
import { createStandardPools } from '@/lib/pools/standard-pools'
import { apiCreated, apiError, apiPaginated, withErrorHandler } from '@/lib/api/response'
import { parsePagination } from '@/lib/api/response'
import { createExamEventSchema, validateBody } from '@/lib/validation/schemas'

export const GET = withErrorHandler(async (req: NextRequest) => {
  await requireStaff()
  const { searchParams } = new URL(req.url)
  const { page, limit, skip } = parsePagination(searchParams)
  const statusFilter = searchParams.get('status')

  const where: any = {}
  if (statusFilter) where.status = statusFilter

  const [events, total] = await Promise.all([
    prisma.examEvent.findMany({
      where,
      include: {
        pools: { select: { id: true, name: true, status: true, currentMemberCount: true } },
        _count: { select: { pools: true } },
      },
      orderBy: { startDate: 'desc' },
      skip,
      take: limit,
    }),
    prisma.examEvent.count({ where }),
  ])

  return apiPaginated(events, total, page, limit)
})

export const POST = withErrorHandler(async (req: NextRequest) => {
  const staff = await requireStaff()
  const body = await req.json()
  const validation = validateBody(createExamEventSchema, body)
  if (validation.success === false) return apiError(validation.error)

  // Check for duplicate event name
  const existingEvent = await prisma.examEvent.findFirst({
    where: {
      name: validation.data.name,
    },
  })

  if (existingEvent) {
    return apiError('Exam event with this name already exists', 409)
  }

  const event = await prisma.examEvent.create({
    data: {
      ...validation.data,
      startDate: new Date(validation.data.startDate),
      endDate: new Date(validation.data.endDate),
      paymentDeadline: new Date(validation.data.paymentDeadline),
      joinDeadline: validation.data.joinDeadline ? new Date(validation.data.joinDeadline) : null,
    },
  })

  // Auto-create 4 standard pools (A-D) for the new exam event
  await createStandardPools(event.id)

  await createAuditLog({
    action: AuditAction.CREATE,
    entity: 'ExamEvent',
    entityId: event.id,
    userId: staff.id,
  })
  return apiCreated(event)
})

