import { prismaUnfiltered } from '@/lib/prisma/client'
import { getAptitudeConfig } from '@/lib/settings'
import { transitionApplication } from '@/lib/admissions/state-machine'
import { calculateSubScores, calculateSessionPercentiles } from './percentile'

export async function gradeAptitudeTest(sessionId: string) {
  // 1. Fetch session with answers
  const session = await prismaUnfiltered.aptitudeTestSession.findUnique({
    where: { id: sessionId },
    include: {
      answers: {
        include: { question: true },
      },
      user: { select: { id: true, application: true } },
    },
  })

  if (!session) throw new Error('Session not found')
  if (
    session.status !== 'IN_PROGRESS' &&
    session.status !== 'TIMED_OUT' &&
    session.status !== 'FLAGGED'
  ) {
    throw new Error('Session already processed')
  }

  // 2. Fetch pass threshold from settings
  const config = await getAptitudeConfig()
  const passThresholdPct = config.aptitude_pass_threshold_pct

  let score = 0
  let totalPoints = 0

  // 3. Grade answers
  for (const answer of session.answers) {
    const question = answer.question
    totalPoints += question.points

    let isCorrect = false
    if (
      answer.selectedAnswer &&
      answer.selectedAnswer.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase()
    ) {
      isCorrect = true
      score += question.points
    }

    await prismaUnfiltered.aptitudeAnswer.update({
      where: { id: answer.id },
      data: { isCorrect, pointsAwarded: isCorrect ? question.points : 0 },
    })
  }

  // 4. Calculate overall percentage
  const percentage = totalPoints > 0 ? (score / totalPoints) * 100 : 0
  const passed = percentage >= passThresholdPct

  // 5. Calculate per-category sub-scores (Criteria-style CBST/CCAT metrics)
  const subScores = calculateSubScores(session.answers)

  const finalStatus = session.status === 'FLAGGED' ? 'FLAGGED' : 'COMPLETED'

  // 6. Update session with scores + sub-scores
  await prismaUnfiltered.aptitudeTestSession.update({
    where: { id: sessionId },
    data: {
      score,
      totalPoints,
      percentage,
      passed,
      status: finalStatus,
      submittedAt: new Date(),
      // Per-category raw scores (CBST-style math/verbal sub-scores)
      mathRawScore: subScores.categories.MATH.rawScore,
      mathTotalQuestions: subScores.categories.MATH.totalQuestions,
      verbalRawScore: subScores.categories.ENGLISH.rawScore,
      verbalTotalQuestions: subScores.categories.ENGLISH.totalQuestions,
      engineeringRawScore: subScores.categories.ENGINEERING.rawScore,
      engineeringTotalQuestions: subScores.categories.ENGINEERING.totalQuestions,
      reasoningRawScore: subScores.categories.LOGICAL_REASONING.rawScore,
      reasoningTotalQuestions: subScores.categories.LOGICAL_REASONING.totalQuestions,
      physicsRawScore: subScores.categories.PHYSICS.rawScore,
      physicsTotalQuestions: subScores.categories.PHYSICS.totalQuestions,
    },
  })

  // 7. Calculate percentile rankings against internal norm group
  // (runs after updating raw scores so this session is included in the norm)
  const percentiles = await calculateSessionPercentiles(sessionId)

  const updatedSession = await prismaUnfiltered.aptitudeTestSession.update({
    where: { id: sessionId },
    data: {
      overallPercentile: percentiles.overallPercentile,
      mathPercentile: percentiles.mathPercentile,
      verbalPercentile: percentiles.verbalPercentile,
      engineeringPercentile: percentiles.engineeringPercentile,
      reasoningPercentile: percentiles.reasoningPercentile,
      physicsPercentile: percentiles.physicsPercentile,
    },
  })

  // 8. Transition applicant pipeline
  const application = session.user.application
  if (application && application.stage === 'APTITUDE_PENDING') {
    if (finalStatus === 'COMPLETED') {
      await transitionApplication(application.id, 'APTITUDE_COMPLETED', session.userId, {
        metadata: {
          sessionId,
          score,
          percentage,
          passed,
          overallPercentile: percentiles.overallPercentile,
          mathPercentile: percentiles.mathPercentile,
          verbalPercentile: percentiles.verbalPercentile,
        },
      })
    }
  }

  return updatedSession
}
