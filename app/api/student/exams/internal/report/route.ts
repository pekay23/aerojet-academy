import { NextRequest } from 'next/server'
import { getAuthSession } from '@/lib/auth/helpers'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { isInternalExamSystemEnabled } from '@/lib/internal-exam/engine'
import { z } from 'zod'

const reportSchema = z.object({
  sessionId: z.string(),
  questionId: z.string().optional(),
  reason: z.string().min(10, 'Please provide at least 10 characters').max(1000),
})

// POST /api/student/exams/internal/report — submit an issue report for a session or specific question
export const POST = withErrorHandler(async (req: NextRequest) => {
  const session = await getAuthSession()
  if (!session?.user?.id) return apiError('Unauthorized', 401)
  if (!(await isInternalExamSystemEnabled())) {
    return apiError('Internal exams are not currently available', 403)
  }

  const body = await req.json()
  const parsed = reportSchema.safeParse(body)
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message || 'Invalid input')

  const { sessionId, questionId, reason } = parsed.data

  // Verify the session belongs to this student
  const examSession = await prismaUnfiltered.internalExamSession.findUnique({
    where: { id: sessionId },
    select: { id: true, studentId: true, status: true },
  })

  if (!examSession) return apiError('Session not found', 404)
  if (examSession.studentId !== session.user.id) return apiError('Unauthorized', 403)

  // Check for duplicate reports (same session + same question)
  const existing = await prismaUnfiltered.internalExamReport.findFirst({
    where: {
      sessionId,
      studentId: session.user.id,
      questionId: questionId || null,
      status: 'PENDING',
    },
  })
  if (existing) {
    return apiError(
      questionId
        ? 'You already have a pending report for this question'
        : 'You already have a pending report for this session'
    )
  }

  // Create the report
  const report = await prismaUnfiltered.internalExamReport.create({
    data: {
      sessionId,
      studentId: session.user.id,
      questionId: questionId || null,
      reason,
      status: 'PENDING',
    },
  })

  return apiSuccess({ reportId: report.id, status: 'PENDING' })
})
