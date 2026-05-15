import { NextRequest } from 'next/server'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { requireAuth } from '@/lib/auth/helpers'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { gradeAptitudeTest } from '@/lib/aptitude/grading'
import { z } from 'zod'

const submitSchema = z.object({
  sessionId: z.string().cuid(),
})

// POST /api/applicant/aptitude/submit
export const POST = withErrorHandler(async (req: NextRequest) => {
  const user = await requireAuth()
  const body = await req.json()
  const parsed = submitSchema.safeParse(body)
  if (!parsed.success) return apiError(parsed.error.issues[0].message)

  const { sessionId } = parsed.data

  const session = await prismaUnfiltered.aptitudeTestSession.findUnique({
    where: { id: sessionId },
  })

  if (!session) return apiError('Session not found', 404)
  if (session.userId !== user.id) return apiError('Unauthorized', 403)
  
  if (session.status === 'COMPLETED' || session.status === 'TIMED_OUT' || session.status === 'VOIDED') {
    return apiSuccess({ message: 'Session already processed' })
  }

  // Check if expired
  if (session.status === 'IN_PROGRESS' && session.expiresAt && new Date() > session.expiresAt) {
    await prismaUnfiltered.aptitudeTestSession.update({
      where: { id: sessionId },
      data: { status: 'TIMED_OUT' }
    })
  }

  // Grade the test
  const gradedSession = await gradeAptitudeTest(sessionId)

  return apiSuccess({ 
    submitted: true, 
    score: gradedSession.score,
    passed: gradedSession.passed
  })
})
