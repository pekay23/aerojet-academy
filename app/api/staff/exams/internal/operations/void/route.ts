import { NextRequest } from 'next/server'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { z } from 'zod'

const voidSchema = z.object({
  sessionId: z.string(),
  reason: z.string().min(1).optional(),
})

/**
 * POST /api/staff/exams/internal/operations/void
 * Voids an exam session and optionally creates a fresh one so the student can retake.
 * The original session is kept as VOIDED for audit trail.
 */
export const POST = withErrorHandler(async (req: NextRequest, _ctx: any) => {
  const staff = await requireStaff()

  const body = await req.json()
  const parsed = voidSchema.safeParse(body)
  if (!parsed.success) return apiError('Invalid input')

  const { sessionId, reason } = parsed.data

  const session = await prismaUnfiltered.internalExamSession.findUnique({
    where: { id: sessionId },
    select: { id: true, studentId: true, bankId: true, status: true, categoryCode: true },
  })

  if (!session) return apiError('Session not found', 404)
  if (session.status === 'VOIDED') return apiError('Session is already voided')

  // Void the original session
  await prismaUnfiltered.internalExamSession.update({
    where: { id: sessionId },
    data: {
      status: 'VOIDED',
      voidedAt: new Date(),
      voidedBy: (staff as any).id || 'staff',
      voidReason: reason || 'Admin-initiated void/reset',
    } as any,
  })

  // Resolve any pending reports for this session
  await prismaUnfiltered.internalExamReport.updateMany({
    where: { sessionId, status: 'PENDING' },
    data: { status: 'RESOLVED', resolvedAt: new Date() },
  })

  return apiSuccess({ voided: true, sessionId })
})
