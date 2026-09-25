import { NextRequest } from 'next/server'
import { requireStaff } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { apiCreated, apiError, withErrorHandler, RouteContext } from '@/lib/api/response'
import { createAuditLog, AuditAction } from '@/lib/audit/logger'
import { z } from 'zod'
import { rateLimitByUser } from '@/lib/security/rate-limit'

const mentorSchema = z.object({
  mentorId: z.string(),
  isPrimary: z.boolean().optional().default(false),
  notes: z.string().optional().nullable(),
})

const MAX_MENTOR_STUDENT_RATIO = 8

// POST — assign a mentor
export const POST = withErrorHandler(async (req: NextRequest, ctx?: RouteContext) => {
  const staff = await requireStaff()
  const rl = rateLimitByUser(staff.id, 30, 60000)
  if (!rl.allowed) {
    return apiError('Too many requests', 429)
  }
  const resolvedParams = await ctx?.params
  if (!resolvedParams?.logbookId) return apiError('Logbook ID required')
  const logbookId = String(resolvedParams.logbookId)
  const body = await req.json()
  const parsed = mentorSchema.safeParse(body)
  if (!parsed.success) return apiError('Invalid input', 400)

  const mentor = await prismaUnfiltered.user.findUnique({
    where: { id: parsed.data.mentorId },
    select: { id: true, role: true },
  })

  if (!mentor || !['ADMIN', 'STAFF', 'INSTRUCTOR'].includes(mentor.role)) {
    return apiError('Invalid mentor', 400)
  }

  const currentAssignments = await prismaUnfiltered.oJTMentorAssignment.count({
    where: { mentorId: parsed.data.mentorId },
  })

  if (currentAssignments >= MAX_MENTOR_STUDENT_RATIO) {
    return apiError(
      `Mentor has reached the maximum allowed student assignments (${MAX_MENTOR_STUDENT_RATIO}).`,
      400
    )
  }

  if (parsed.data.isPrimary) {
    const existingPrimary = await prismaUnfiltered.oJTMentorAssignment.findFirst({
      where: { logbookId: String(logbookId), isPrimary: true },
      select: { id: true },
    })
    if (existingPrimary) {
      await prismaUnfiltered.oJTMentorAssignment.update({
        where: { id: existingPrimary.id },
        data: { isPrimary: false },
      })
    }
  }

  const assignment = await prismaUnfiltered.oJTMentorAssignment.create({
    data: {
      logbookId: String(logbookId),
      mentorId: parsed.data.mentorId,
      assignedDate: new Date(),
      isPrimary: parsed.data.isPrimary,
      notes: parsed.data.notes || null,
    },
  })

  // Fetch mentor name and student info for readable audit log
  const [mentorUser, logbook] = await Promise.all([
    prismaUnfiltered.user.findUnique({
      where: { id: parsed.data.mentorId },
      select: { email: true, profile: { select: { firstName: true, lastName: true } } },
    }),
    prismaUnfiltered.oJTLogbook.findUnique({
      where: { id: logbookId },
      select: {
        id: true,
        studentProfile: {
          select: {
            studentId: true,
            user: {
              select: { email: true, profile: { select: { firstName: true, lastName: true } } },
            },
          },
        },
      },
    }),
  ])

  const mentorName = mentorUser?.profile
    ? `${mentorUser.profile.firstName ?? ''} ${mentorUser.profile.lastName ?? ''}`.trim()
    : mentorUser?.email || 'Unknown'
  const studentId = logbook?.studentProfile?.studentId || 'Unknown'

  await createAuditLog({
    userId: staff.id,
    action: AuditAction.CREATE,
    entity: 'OJTMentorAssignment',
    entityId: assignment.id,
    description: `Mentor ${mentorName} assigned to logbook for student ${studentId}`,
    changes: {
      mentorId: parsed.data.mentorId,
      isPrimary: parsed.data.isPrimary,
      notes: parsed.data.notes,
      currentAssignments: currentAssignments + 1,
    },
  })

  return apiCreated(assignment)
})
