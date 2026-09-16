import { NextRequest } from 'next/server'
import { requireStaff } from '@/lib/auth/helpers'
import {
  apiSuccess,
  apiNotFound,
  apiError,
  withErrorHandler,
  RouteContext,
} from '@/lib/api/response'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { createAuditLog, AuditAction } from '@/lib/audit/logger'
import { TestSessionStatus } from '@/lib/internal-exam/state-machine'

const TERMINAL_SESSION_STATUSES: TestSessionStatus[] = ['COMPLETED', 'TIMED_OUT', 'FLAGGED']

export const POST = withErrorHandler(
  async (_req: NextRequest, ctx: RouteContext<{ bankId: string }>) => {
    const staff = await requireStaff()
    const { bankId } = await ctx.params

    const result = await prismaUnfiltered.$transaction(async (tx) => {
      const bank = await tx.internalExamBank.findUnique({
        where: { id: bankId },
        select: { id: true, name: true, isActive: true },
      })
      if (!bank) return { kind: 'notFound' as const }
      if (!bank.isActive) return { kind: 'alreadyRetired' as const, bank }

      const now = new Date()
      const [activeSessionCount, futureScheduleCount, pendingQuestionCount] = await Promise.all([
        tx.internalExamSession.count({
          where: {
            bankId,
            status: { notIn: TERMINAL_SESSION_STATUSES },
          },
        }),
        tx.internalExamClassSchedule.count({
          where: { bankId, isActive: true, scheduledStart: { gte: now } },
        }),
        tx.internalExamQuestion.count({
          where: { bankId, status: 'PENDING_APPROVAL' },
        }),
      ])

      if (activeSessionCount > 0 || futureScheduleCount > 0 || pendingQuestionCount > 0) {
        return {
          kind: 'blocked' as const,
          blockers: { activeSessionCount, futureScheduleCount, pendingQuestionCount },
        }
      }

      const updated = await tx.internalExamBank.update({
        where: { id: bankId },
        data: { isActive: false },
        select: { id: true, name: true, isActive: true },
      })
      return { kind: 'retired' as const, bank: updated }
    })

    if (result.kind === 'notFound') return apiNotFound('Bank not found')
    if (result.kind === 'blocked') {
      return apiError('Bank cannot be retired while active work is pending', 409, {
        blockers: result.blockers,
      })
    }
    if (result.kind === 'retired') {
      await createAuditLog({
        userId: staff.id,
        action: AuditAction.UPDATE,
        entity: 'InternalExamBank',
        entityId: result.bank.id,
        description: `Exam bank ${result.bank.name} retired`,
        changes: { before: { isActive: true }, after: { isActive: false } },
      })
    }

    return apiSuccess(result.bank)
  }
)
