import 'server-only'

import { NextRequest } from 'next/server'
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
  const resolvedParams = await ctx?.params
  if (!resolvedParams?.logbookId || !resolvedParams?.assignmentId) return apiError('IDs required')
  const logbookId = String(resolvedParams.logbookId)
  const assignmentId = String(resolvedParams.assignmentId)
  const body = await req.json()
  const parsed = updateMentorSchema.safeParse(body)
  if (!parsed.success) return apiError('Invalid input', 400)

  const assignment = await prismaUnfiltered.oJTMentorAssignment.findUnique({
    where: { id: assignmentId },
    select: { id: true, logbookId: true, mentorId: true },
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
  if (parsed.data.endDate !== undefined)
    data.endDate = parsed.data.endDate ? new Date(parsed.data.endDate) : null

  const updated = await prismaUnfiltered.oJTMentorAssignment.update({
    where: { id: assignmentId },
    data,
  })

  // Fetch mentor name for readable audit log
  const mentorUser = await prismaUnfiltered.user.findUnique({
    where: { id: assignment.mentorId },
    select: { email: true, profile: { select: { firstName: true, lastName: true } } },
  })
  const mentorName = mentorUser?.profile
    ? `${mentorUser.profile.firstName ?? ''} ${mentorUser.profile.lastName ?? ''}`.trim()
    : mentorUser?.email || 'Unknown'

  await createAuditLog({
    userId: staff.id,
    action: AuditAction.UPDATE,
    entity: 'OJTMentorAssignment',
    entityId: assignmentId,
    description: `Updated mentor assignment for mentor ${mentorName}`,
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
  if (!ctx?.params) return apiError('IDs required')
  const resolvedParams = await ctx.params
  if (!resolvedParams.logbookId || !resolvedParams.assignmentId) return apiError('IDs required')
  const logbookId = String(resolvedParams.logbookId)
  const assignmentId = String(resolvedParams.assignmentId)

  const assignment = await prismaUnfiltered.oJTMentorAssignment.findUnique({
    where: { id: assignmentId },
    select: { id: true, logbookId: true, mentorId: true },
  })

  if (!assignment || assignment.logbookId !== logbookId) {
    return apiError('Assignment not found', 404)
  }

  // Fetch mentor name for readable audit log
  const mentorUser = await prismaUnfiltered.user.findUnique({
    where: { id: assignment.mentorId },
    select: { email: true, profile: { select: { firstName: true, lastName: true } } },
  })
  const mentorName = mentorUser?.profile
    ? `${mentorUser.profile.firstName ?? ''} ${mentorUser.profile.lastName ?? ''}`.trim()
    : mentorUser?.email || 'Unknown'

  await prismaUnfiltered.oJTMentorAssignment.delete({ where: { id: assignmentId } })

  await createAuditLog({
    userId: staff.id,
    action: AuditAction.DELETE,
    entity: 'OJTMentorAssignment',
    entityId: assignmentId,
    description: `Mentor ${mentorName} removed from logbook`,
    changes: { logbookId, assignmentId },
  })

  return apiSuccess({ message: 'Assignment removed' })
})
