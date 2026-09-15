import { NextRequest } from 'next/server'
import { requireStaff } from '@/lib/auth/helpers'
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
    const staff = await requireStaff()
    if (!(await isInternalExamSystemEnabled())) {
      return apiError('Internal exams are not currently available', 403)
    }

    const { id } = (await ctx!.params) as { id: string }
    const body = (await req.json().catch(() => ({}))) || {}
    const { candidateId: requestedCandidateId, candidateDetails } = body

    const existing = await prismaUnfiltered.internalExamSession.findUnique({
      where: { id },
      select: { id: true, status: true, supervised: true, studentId: true, bankId: true, classId: true },
    })

    if (!existing) return apiError('Session not found', 404)

    const candidateId = existing.studentId
    if (!candidateId) {
      return apiError('Session has no assigned candidate', 400)
    }
    if (requestedCandidateId && requestedCandidateId !== candidateId) {
      return apiError('Candidate does not match the assigned session student', 400)
    }

    const candidate = await prismaUnfiltered.user.findFirst({
      where: { id: candidateId, role: 'STUDENT' },
      select: { id: true, email: true },
    })
    if (!candidate) return apiError(`Candidate ${candidateId} is not a valid student`, 404)

    const bank = await prismaUnfiltered.internalExamBank.findUnique({
      where: { id: existing.bankId },
      select: { id: true, courseId: true },
    })
    if (!bank) return apiError('Session bank not found', 404)

    const enrollment = await prismaUnfiltered.enrollment.findFirst({
      where: { userId: candidateId, courseId: bank.courseId },
      select: { id: true },
    })
    if (!enrollment) return apiError(`Candidate ${candidateId} is not enrolled in course ${bank.courseId}`, 403)

    try {
      validateSessionTransition(existing.status, 'IN_PROGRESS')
    } catch {
      return apiError(`Session cannot be started from current status: ${existing.status}`, 400)
    }

    const updated = await transitionExamSession(
      id,
      'IN_PROGRESS',
      staff.id,
      'Supervised exam started',
      { supervised: true, startedAt: new Date() }
    )

    const requestContext = await getRequestContext()
    await createAuditLog({
      userId: staff.id,
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
