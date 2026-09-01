import 'server-only'

import { NextRequest, NextResponse } from 'next/server'
import { requireStaff } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { apiSuccess, apiError, withErrorHandler, RouteContext } from '@/lib/api/response'
import { createAuditLog, AuditAction } from '@/lib/audit/logger'
import { z } from 'zod'
import { rateLimitByUser } from '@/lib/security/rate-limit'

const updateMentorSchema = z.object({
  isPrimary: z.boolean().optional(),
  notes: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
})

export const PATCH = withErrorHandler(async (req: NextRequest, ctx?: RouteContext) => {
  const staff = await requireStaff()
  const rl = rateLimitByUser(staff.id, 30, 60000)
  if (!rl.allowed) {
    return apiError('Too many requests', 429)
  }
  if (!ctx?.params?.logbookId || !ctx?.params?.assignmentId) return apiError('IDs required')
  const { logbookId, assignmentId } = ctx.params
  const body = await req.json()
  const parsed = updateMentorSchema.safeParse(body)
  if (!parsed.success) return apiError('Invalid input', 400)

  const assignment = await prismaUnfiltered.oJTMentorAssignment.findUnique({
    where: { id: assignmentId },
    select: { id: true, logbookId: true },
  })

  if (!assignment || assignment.logbookId !== logbookId) {
    return apiError('Assignment not found', 404)
  }

  if (parsed.data.isPrimary) {
    await prismaUnfiltered.oJTMentorAssignment.updateMany({
      where: { logbookId, id: { not: assignmentId } },
      data: { isPrimary: false },
    })
  }

  const data: Record<string, unknown> = {}
  if (parsed.data.isPrimary !== undefined) data.isPrimary = parsed.data.isPrimary
  if (parsed.data.notes !== undefined) data.notes = parsed.data.notes
  if (parsed.data.endDate !== undefined) data.endDate = parsed.data.endDate ? new Date(parsed.data.endDate) : null

  const updated = await prismaUnfiltered.oJTMentorAssignment.update({
    where: { id: assignmentId },
    data,
  })

  await createAuditLog({
    userId: staff.id,
    action: AuditAction.UPDATE,
    entity: 'OJTMentorAssignment',
    entityId: assignmentId,
    description: `Updated mentor assignment ${assignmentId}`,
    changes: parsed.data,
  })

  return apiSuccess(updated)
})

export const DELETE = withErrorHandler(async (req: NextRequest, ctx?: RouteContext) => {
  const staff = await requireStaff()
  const rl = rateLimitByUser(staff.id, 30, 60000)
  if (!rl.allowed) {
    return apiError('Too many requests', 429)
  }
  if (!ctx?.params?.logbookId || !ctx?.params?.assignmentId) return apiError('IDs required')
  const { logbookId, assignmentId } = ctx.params

  const assignment = await prismaUnfiltered.oJTMentorAssignment.findUnique({
    where: { id: assignmentId },
    select: { id: true, logbookId: true },
  })

  if (!assignment || assignment.logbookId !== logbookId) {
    return apiError('Assignment not found', 404)
  }

  await prismaUnfiltered.oJTMentorAssignment.delete({ where: { id: assignmentId } })

  await createAuditLog({
    userId: staff.id,
    action: AuditAction.DELETE,
    entity: 'OJTMentorAssignment',
    entityId: assignmentId,
    description: 'Mentor assignment removed',
    changes: { logbookId, assignmentId },
  })

  return apiSuccess({ message: 'Assignment removed' })
})
