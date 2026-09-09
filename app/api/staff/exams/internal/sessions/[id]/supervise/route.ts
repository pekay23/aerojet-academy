import { NextRequest } from 'next/server'
import { getAuthSession, requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiError, withErrorHandler, RouteContext } from '@/lib/api/response'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { isInternalExamSystemEnabled } from '@/lib/internal-exam/engine'
import { createAuditLog, AuditAction } from '@/lib/audit/logger'
import { getRequestContext } from '@/lib/server/request-context'
import { transitionExamSession, validateSessionTransition } from '@/lib/internal-exam/state-machine'

export const GET = withErrorHandler(
  async (_req: NextRequest, ctx: RouteContext<{ id: string }>) => {
    await requireStaff()

    const { id } = (await ctx!.params) as { id: string }

    const session = await prismaUnfiltered.internalExamSession.findUnique({
      where: { id },
      include: {
        bank: { select: { id: true, name: true, course: { select: { code: true, name: true } } } },
        student: {
          select: {
            id: true,
            email: true,
            profile: { select: { firstName: true, lastName: true } },
          },
        },
        class: { select: { id: true, name: true, classroom: { select: { name: true } } } },
      },
    })

    if (!session) return apiError('Session not found', 404)

    return apiSuccess({
      session: {
        id: session.id,
        status: session.status,
        supervised: session.supervised,
        bank: session.bank,
        student: session.student,
        class: session.class,
      },
    })
  }
)

export const POST = withErrorHandler(
  async (req: NextRequest, ctx: RouteContext<{ id: string }>) => {
    await requireStaff()
    if (!(await isInternalExamSystemEnabled())) {
      return apiError('Internal exams are not currently available', 403)
    }

    const { id } = (await ctx!.params) as { id: string }
    const body = await req.json()
    const { candidateId, candidateDetails } = body || {}

    if (!candidateId) {
      return apiError('candidateId is required', 400)
    }

    const existing = await prismaUnfiltered.internalExamSession.findUnique({
      where: { id },
      select: { id: true, status: true, supervised: true, studentId: true },
    })

    if (!existing) return apiError('Session not found', 404)

    try {
      validateSessionTransition(existing.status, 'IN_PROGRESS')
    } catch {
      return apiError(`Session cannot be started from current status: ${existing.status}`, 400)
    }

    const updated = await transitionExamSession(
      id,
      'IN_PROGRESS',
      (await getAuthSession())?.user?.id || 'system',
      'Supervised exam started',
      { supervised: true, studentId: candidateId, startedAt: new Date() }
    )

    const requestContext = await getRequestContext()
    await createAuditLog({
      userId: (await getAuthSession())?.user?.id,
      action: AuditAction.EXAM_SESSION_STARTED,
      entity: 'InternalExamSession',
      entityId: id,
      description: `Started supervised exam session ${id} for candidate ${candidateId}`,
      changes: { candidateId, candidateDetails: candidateDetails || null, supervised: true },
      ipAddress: requestContext.ipAddress ?? undefined,
      userAgent: requestContext.userAgent ?? undefined,
    })

    return apiSuccess({
      success: true,
      session: { id: updated.id, supervised: true, status: updated.status },
    })
  }
)
