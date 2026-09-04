import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { requireAuth } from '@/lib/auth/helpers'
import { apiSuccess, withErrorHandler } from '@/lib/api/response'

// GET /api/applicant/aptitude/session
export const GET = withErrorHandler(async (_req: NextRequest) => {
  const user = await requireAuth()

  // Find active session
  const session = await prisma.aptitudeTestSession.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      answers: {
        include: {
          question: { select: { id: true, category: true, questionType: true, text: true, options: true } }
        }
      }
    }
  })

  if (!session) return apiSuccess(null)

  // Clean answers for applicant
  const cleanAnswers = session.answers.map(a => ({
    questionId: a.question.id,
    category: a.question.category,
    questionType: a.question.questionType,
    text: a.question.text,
    options: a.question.options,
    selectedAnswer: a.selectedAnswer,
  }))

  return apiSuccess({
    id: session.id,
    status: session.status,
    expiresAt: session.expiresAt,
    questions: cleanAnswers,
  })
})
