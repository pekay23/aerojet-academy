import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiError, apiNotFound, withErrorHandler } from '@/lib/api/response'
import { updateClassSchema, validateBody } from '@/lib/validation/schemas'
import { AuditAction, createAuditLog } from '@/lib/audit/logger'

export const GET = withErrorHandler(
  async (req: NextRequest, ctx?: { params: Record<string, string> }) => {
    await requireStaff()
    const cls = await prisma.class.findUnique({
      where: { id: ctx?.params?.id },
      include: {
        course: true,
        instructor: { include: { user: { include: { profile: true } } } },
        attendanceRecords: { orderBy: { date: 'desc' }, take: 30 },
      },
    })
    if (!cls) return apiNotFound('Class not found')
    return apiSuccess(cls)
  }
)

export const PATCH = withErrorHandler(
  async (req: NextRequest, ctx?: { params: Record<string, string> }) => {
    const staff = await requireStaff()
    const body = await req.json()
    const validation = validateBody(updateClassSchema, body)
    if (!validation.success) return apiError(validation.error)
    const id = ctx?.params?.id
    const updated = await prisma.class.update({ where: { id }, data: validation.data })
    await createAuditLog({
      action: AuditAction.UPDATE,
      entity: 'Class',
      entityId: id!,
      userId: staff.id,
      details: validation.data,
    })
    return apiSuccess(updated)
  }
)
