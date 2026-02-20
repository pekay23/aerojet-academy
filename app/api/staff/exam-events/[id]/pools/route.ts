import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiCreated, apiError, withErrorHandler } from '@/lib/api/response'
import { createExamPoolSchema, validateBody } from '@/lib/validation/schemas'
import { createAuditLog, AuditAction } from '@/lib/audit/logger'

export const GET = withErrorHandler(
  async (req: NextRequest, ctx?: { params: Record<string, string> }) => {
    await requireStaff()
    const pools = await prisma.examPool.findMany({
      where: { eventId: ctx?.params?.id },
      include: { _count: { select: { memberships: true } } },
      orderBy: { examDate: 'asc' },
    })
    return apiSuccess(pools)
  }
)

export const POST = withErrorHandler(
  async (req: NextRequest, ctx?: { params: Record<string, string> }) => {
    const staff = await requireStaff()
    const body = await req.json()
    const data = { ...body, eventId: ctx?.params?.id }
    const validation = validateBody(createExamPoolSchema, data)
    if (!validation.success) return apiError((validation as any).error)

    const pool = await prisma.examPool.create({
      data: { ...validation.data, status: 'OPEN' } as any,
    })
    await createAuditLog({
      action: AuditAction.CREATE,
      entity: 'ExamPool',
      entityId: pool.id,
      userId: staff.id,
    })
    return apiCreated(pool)
  }
)
