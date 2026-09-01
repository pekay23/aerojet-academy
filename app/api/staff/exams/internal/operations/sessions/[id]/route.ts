import { NextRequest } from 'next/server'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiNotFound, withErrorHandler } from '@/lib/api/response'
import { prismaUnfiltered } from '@/lib/prisma/client'

/**
 * GET /api/staff/exams/internal/operations/sessions/[id]
 * Full answer breakdown for a single exam session. Split from the list
 * endpoint to keep the per-page payload small — answers are only fetched
 * when the admin actually drills into a row.
 */
export const GET = withErrorHandler(async (
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) => {
  await requireStaff()
  const { id } = await ctx.params

  const s = await prismaUnfiltered.internalExamSession.findUnique({
    where: { id },
    include: {
      student: {
        select: {
          id: true,
          email: true,
          profile: { select: { firstName: true, lastName: true } },
          studentProfile: { select: { studentId: true } },
        },
      },
      bank: {
        select: {
          id: true,
          name: true,
          moduleCode: true,
          course: { select: { code: true } },
        },
      },
      answers: {
        select: {
          id: true,
          questionId: true,
          selectedAnswer: true,
          isCorrect: true,
          pointsAwarded: true,
          answeredAt: true,
          question: {
            select: {
              id: true,
              text: true,
              options: true,
              correctAnswer: true,
              points: true,
              syllabusRef: true,
            },
          },
        },
      },
      reports: {
        select: {
          id: true,
          reason: true,
          status: true,
          createdAt: true,
          questionId: true,
          question: { select: { syllabusRef: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!s) return apiNotFound('Session not found')

  const certificates = await prismaUnfiltered.certificate.findMany({
    where: { sessionId: s.id },
    select: {
      id: true,
      certificateId: true,
      pdfUrl: true,
      verified: true,
      issuedAt: true,
    },
  })

  return apiSuccess({
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
    isPublished: s.isPublished,
    autoSubmitted: s.autoSubmitted,
    voidedAt: s.voidedAt?.toISOString() || null,
    voidReason: s.voidReason,
    answers: s.answers.map((a) => ({
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
    reports: s.reports.map((r) => ({
      id: r.id,
      reason: r.reason,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
      questionId: r.questionId,
      questionRef: r.question?.syllabusRef ?? null,
    })),
    certificates: certificates.map((c) => ({
      id: c.id,
      certificateId: c.certificateId,
      pdfUrl: c.pdfUrl,
      verified: c.verified,
      issuedAt: c.issuedAt.toISOString(),
    })),
  })
})
