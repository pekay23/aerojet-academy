import { NextRequest } from 'next/server'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { getAptitudeConfig } from '@/lib/settings'
import { requireAuth } from '@/lib/auth/helpers'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { selectQuestions } from '@/lib/aptitude/question-selector'
import { addMinutes } from 'date-fns'

// POST /api/applicant/aptitude/start
export const POST = withErrorHandler(async (_req: NextRequest) => {
  const user = await requireAuth()

  // 1. Check if user is eligible (at APTITUDE_PENDING)
  const application = await prismaUnfiltered.application.findUnique({
    where: { userId: user.id },
  })

  if (!application) return apiError('Application not found', 404)
  if (application.stage !== 'APTITUDE_PENDING') {
    return apiError('You are not eligible to start the aptitude test at this stage', 403)
  }

  // 2. Fetch config
  const config = await getAptitudeConfig()
  const timeLimitMins = config.aptitude_time_limit_minutes
  
  const questionCounts = {
    MATH: config.aptitude_math_count,
    ENGLISH: config.aptitude_english_count,
    ENGINEERING: config.aptitude_engineering_count,
    LOGICAL_REASONING: config.aptitude_reasoning_count,
    PHYSICS: config.aptitude_physics_count,
  }

  // 3. Check for existing active session
  let session = await prismaUnfiltered.aptitudeTestSession.findFirst({
    where: { userId: user.id, status: 'IN_PROGRESS' },
    include: { answers: true }
  })

  if (session) {
    if (session.expiresAt && new Date() > session.expiresAt) {
      // Mark as timed out if expired
      await prismaUnfiltered.aptitudeTestSession.update({
        where: { id: session.id },
        data: { status: 'TIMED_OUT' }
      })
      // Grade timed out session
      // For simplicity, we won't grade here, let the submission/cleanup handle it.
      return apiError('Your previous session timed out. Please contact admissions.', 403)
    }
    // Return existing session
    return apiSuccess({ sessionId: session.id, expiresAt: session.expiresAt })
  }

  // 4. Find active bank matching programme
  const activeBanks = await prismaUnfiltered.aptitudeTestBank.findMany({
    where: { isActive: true },
  })
  if (activeBanks.length === 0) return apiError('No active test banks found', 500)

  // Try to find one matching programme choice
  let selectedBank = activeBanks.find(b => b.applicableProgrammes.includes(application.programmeChoice))
  // Fallback to any active bank if none specifically match
  if (!selectedBank) selectedBank = activeBanks[0]

  // 5. Select questions
  const selectedQuestionIds = await selectQuestions(selectedBank.id, questionCounts)
  if (selectedQuestionIds.length === 0) {
    return apiError('No questions available in the test bank', 500)
  }

  // 6. Create session & blank answers
  session = await prismaUnfiltered.aptitudeTestSession.create({
    data: {
      userId: user.id,
      bankId: selectedBank.id,
      status: 'IN_PROGRESS',
      startedAt: new Date(),
      expiresAt: addMinutes(new Date(), timeLimitMins),
      answers: {
        create: selectedQuestionIds.map(qid => ({
          questionId: qid,
        }))
      }
    },
    include: { answers: true }
  })

  return apiSuccess({ sessionId: session.id, expiresAt: session.expiresAt })
})
