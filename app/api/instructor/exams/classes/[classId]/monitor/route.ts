import { NextRequest } from 'next/server'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { requireInstructor } from '@/lib/auth/helpers'
import {
  apiSuccess,
  apiError,
  apiForbidden,
  apiNotFound,
  withErrorHandler,
  RouteContext,
} from '@/lib/api/response'
import { getInstructorProfileByUserId } from '@/lib/instructor/profile'
import { isInternalExamSystemEnabled } from '@/lib/internal-exam/engine'

export const GET = withErrorHandler(async (req: NextRequest, ctx?: RouteContext) => {
  const user = await requireInstructor()
  const instructorProfile = await getInstructorProfileByUserId(user.id)
  if (!instructorProfile) return apiForbidden('Instructor profile not found')

  if (!(await isInternalExamSystemEnabled())) {
    return apiError('Internal exams are not currently available', 403)
  }
  const { classId } = (await ctx!.params) as { classId: string }

  const classItem = await prismaUnfiltered.class.findUnique({
    where: { id: classId },
    select: { id: true, instructorId: true },
  })
  if (!classItem) return apiNotFound('Class not found')
  if (classItem.instructorId !== instructorProfile.id) {
    return apiForbidden('Not assigned to this class')
  }

  const sessions = await prismaUnfiltered.internalExamSession.findMany({
    where: { classId },
    include: {
      student: {
        select: { id: true, email: true, profile: { select: { firstName: true, lastName: true } } },
      },
      bank: { select: { id: true, name: true } },
      answers: {
        include: {
          question: { select: { id: true, correctAnswer: true, points: true, text: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const now = new Date()

  const result = sessions.map((s) => {
    let correctCount = 0
    let totalPoints = 0

    for (const answer of s.answers) {
      if (answer.question) {
        totalPoints += answer.question.points
        if (
          answer.selectedAnswer !== null &&
          answer.selectedAnswer === answer.question.correctAnswer
        ) {
          correctCount++
        }
      }
    }

    const timeRemaining =
      s.status === 'IN_PROGRESS' && s.expiresAt
        ? Math.max(0, Math.floor((s.expiresAt.getTime() - now.getTime()) / 1000))
        : null

    return {
      id: s.id,
      status: s.status,
      student: {
        id: s.student.id,
        name:
          `${s.student.profile?.firstName || ''} ${s.student.profile?.lastName || ''}`.trim() ||
          s.student.email,
        email: s.student.email,
      },
      bank: s.bank,
      startedAt: s.startedAt?.toISOString() || null,
      expiresAt: s.expiresAt?.toISOString() || null,
      submittedAt: s.submittedAt?.toISOString() || null,
      score: s.score,
      totalPoints: s.totalPoints ?? totalPoints,
      percentage: s.percentage,
      passed: s.passed,
      correctCount,
      timeRemaining,
      answerCount: s.answers.length,
      answers: s.answers.map((answer) => ({
        question: answer.question,
        selectedAnswer: answer.selectedAnswer,
        pointsAwarded: answer.pointsAwarded,
        isCorrect: answer.isCorrect,
        answeredAt: answer.answeredAt?.toISOString() || null,
      })),
    }
  })

  return apiSuccess(result)
})
