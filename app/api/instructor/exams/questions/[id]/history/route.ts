import { NextRequest } from 'next/server'
import { requireInstructor } from '@/lib/auth/helpers'
import { apiSuccess, apiError, apiForbidden, withErrorHandler } from '@/lib/api/response'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { getInstructorProfileByUserId } from '@/lib/instructor/profile'

export const GET = withErrorHandler(
  async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
    const user = await requireInstructor()
    const instructorProfile = await getInstructorProfileByUserId(user.id)
    if (!instructorProfile) return apiForbidden('Instructor profile not found')

    const { id } = await ctx.params

    const [versions, audits] = await Promise.all([
      prismaUnfiltered.internalExamQuestionVersion.findMany({
        where: { questionId: id },
        orderBy: { changedAt: 'desc' },
      }) as unknown as Array<{
        id: string
        changedAt: Date | null
        changeType: string
        version: number
        text: string | null
        options: unknown
        correctAnswer: string | null
        points: number | null
        difficulty: string
        changeReason: string | null
        changedById: string | null
      }>,
      prismaUnfiltered.auditLog.findMany({
        where: { entity: 'InternalExamQuestion', entityId: id },
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              profile: { select: { firstName: true, lastName: true } },
            },
          },
        },
      }),
    ])

    const merged = [
      ...versions.map((v) => ({
        type: 'version' as const,
        id: v.id,
        timestamp: v.changedAt,
        actor: 'Unknown',
        action: v.changeType,
        details: {
          version: v.version,
          text: v.text,
          options: v.options,
          correctAnswer: v.correctAnswer,
          points: v.points,
          difficulty: v.difficulty,
          changeReason: v.changeReason,
        },
      })),
      ...audits.map((a) => ({
        type: 'audit' as const,
        id: a.id,
        timestamp: a.createdAt,
        actor: a.user
          ? `${a.user.profile?.firstName || ''} ${a.user.profile?.lastName || ''}`.trim() ||
            a.user.email
          : 'System',
        action: a.action,
        details: {
          description: a.description,
          changes: a.changes,
        },
      })),
    ].sort((a, b) => (b.timestamp?.getTime() ?? 0) - (a.timestamp?.getTime() ?? 0))

    return apiSuccess(merged)
  }
)
