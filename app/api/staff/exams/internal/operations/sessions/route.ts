import { NextRequest } from 'next/server'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { prismaUnfiltered } from '@/lib/prisma/client'

/**
 * GET /api/staff/exams/internal/operations/sessions
 * Returns all exam sessions grouped by status for admin monitoring.
 * Includes live (in-progress), completed (pending review), and published sessions.
 */
export const GET = withErrorHandler(async (req: NextRequest, _ctx: any) => {
  await requireStaff()

  const url = new URL(req.url)
  const status = url.searchParams.get('status') // IN_PROGRESS, COMPLETED, TIMED_OUT, VOIDED
  const bankId = url.searchParams.get('bankId')

  const where: any = {}
  if (status) where.status = status
  if (bankId) where.bankId = bankId

  const sessions = await prismaUnfiltered.internalExamSession.findMany({
    where,
    include: {
      student: {
        select: {
          id: true,
          email: true,
          profile: { select: { firstName: true, lastName: true } },
          studentProfile: { select: { studentId: true } },
        },
      },
      bank: { select: { id: true, name: true, moduleCode: true, course: { select: { code: true } } } },
      answers: {
        select: {
          id: true,
          questionId: true,
          selectedAnswer: true,
          isCorrect: true,
          pointsAwarded: true,
          answeredAt: true,
          question: { select: { id: true, text: true, options: true, correctAnswer: true, points: true, syllabusRef: true } },
        },
      },
      reports: {
        select: { id: true, reason: true, status: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
  })

  return apiSuccess(
    sessions.map(s => ({
      id: s.id,
      student: {
        id: s.student.id,
        name: s.student.profile
          ? `${s.student.profile.firstName} ${s.student.profile.lastName}`
          : s.student.email,
        email: s.student.email,
        studentId: s.student.studentProfile?.studentId || null,
      },
      bank: {
        id: s.bank.id,
        name: s.bank.name,
        moduleCode: s.bank.moduleCode,
        courseCode: s.bank.course.code,
      },
      status: s.status,
      startedAt: s.startedAt?.toISOString() || null,
      expiresAt: s.expiresAt?.toISOString() || null,
      submittedAt: s.submittedAt?.toISOString() || null,
      score: s.score,
      totalPoints: s.totalPoints,
      percentage: s.percentage,
      passed: s.passed,
      isPublished: (s as any).isPublished || false,
      autoSubmitted: s.autoSubmitted,
      answers: s.answers.map(a => ({
        id: a.id,
        questionId: a.questionId,
        questionText: a.question.text,
        questionRef: a.question.syllabusRef,
        options: a.question.options,
        correctAnswer: a.question.correctAnswer,
        selectedAnswer: a.selectedAnswer,
        isCorrect: a.isCorrect,
        points: a.question.points,
        pointsAwarded: a.pointsAwarded,
        answeredAt: a.answeredAt?.toISOString() || null,
      })),
      reports: s.reports,
    }))
  )
})
