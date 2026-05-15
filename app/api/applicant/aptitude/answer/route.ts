import { NextRequest } from 'next/server'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { requireAuth } from '@/lib/auth/helpers'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { z } from 'zod'

const answerSchema = z.object({
  sessionId: z.string().cuid(),
  questionId: z.string().cuid(),
  answer: z.string(),
})

// POST /api/applicant/aptitude/answer
export const POST = withErrorHandler(async (req: NextRequest) => {
  const user = await requireAuth()
  const body = await req.json()
  const parsed = answerSchema.safeParse(body)
  if (!parsed.success) return apiError(parsed.error.issues[0].message)

  const { sessionId, questionId, answer } = parsed.data

  // Validate session belongs to user and is active
  const session = await prismaUnfiltered.aptitudeTestSession.findUnique({
    where: { id: sessionId },
  })

  if (!session) return apiError('Session not found', 404)
  if (session.userId !== user.id) return apiError('Unauthorized', 403)
  if (session.status !== 'IN_PROGRESS') return apiError(`Session is ${session.status}`, 403)
  
  if (session.expiresAt && new Date() > session.expiresAt) {
    await prismaUnfiltered.aptitudeTestSession.update({
      where: { id: sessionId },
      data: { status: 'TIMED_OUT' }
    })
    return apiError('Time expired', 403)
  }

  // Update answer
  const updatedAnswer = await prismaUnfiltered.aptitudeAnswer.update({
    where: { sessionId_questionId: { sessionId, questionId } },
    data: { 
      selectedAnswer: answer,
      answeredAt: new Date(),
    }
  })

  return apiSuccess({ saved: true })
})
