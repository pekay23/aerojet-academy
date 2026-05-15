import { prismaUnfiltered } from '@/lib/prisma/client'
import { getAptitudeConfig } from '@/lib/settings'
import { ApplicationStage } from '@prisma/client'
import { transitionApplication } from '@/lib/admissions/state-machine'

export async function gradeAptitudeTest(sessionId: string) {
  // 1. Fetch session with answers
  const session = await prismaUnfiltered.aptitudeTestSession.findUnique({
    where: { id: sessionId },
    include: {
      answers: {
        include: { question: true }
      },
      user: { select: { id: true, application: true } }
    }
  })

  if (!session) throw new Error('Session not found')
  if (session.status !== 'IN_PROGRESS' && session.status !== 'TIMED_OUT' && session.status !== 'FLAGGED') {
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
    if (answer.selectedAnswer && answer.selectedAnswer.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase()) {
      isCorrect = true
      score += question.points
    }

    await prismaUnfiltered.aptitudeAnswer.update({
      where: { id: answer.id },
      data: { isCorrect, pointsAwarded: isCorrect ? question.points : 0 }
    })
  }

  // 4. Calculate final percentage
  const percentage = totalPoints > 0 ? (score / totalPoints) * 100 : 0
  const passed = percentage >= passThresholdPct

  // Ensure status reflects completion (don't override FLAGGED)
  const finalStatus = session.status === 'FLAGGED' ? 'FLAGGED' : 'COMPLETED'

  // 5. Update session record
  const updatedSession = await prismaUnfiltered.aptitudeTestSession.update({
    where: { id: sessionId },
    data: {
      score,
      totalPoints,
      percentage,
      passed,
      status: finalStatus,
      submittedAt: new Date()
    }
  })

  // 6. Transition applicant pipeline
  const application = session.user.application
  if (application && application.stage === 'APTITUDE_PENDING') {
    // Only transition if the test is completed normally. 
    // If FLAGGED, we wait for staff to review and manually advance or void.
    if (finalStatus === 'COMPLETED') {
      await transitionApplication(
        application.id,
        'APTITUDE_COMPLETED',
        session.userId,
        { metadata: { sessionId, score, percentage, passed } }
      )
    }
  }

  return updatedSession
}
