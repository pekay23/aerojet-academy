import { NextRequest } from 'next/server'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiNotFound, withErrorHandler, RouteContext } from '@/lib/api/response'
import { prismaUnfiltered } from '@/lib/prisma/client'

/**
 * GET /api/staff/exams/internal/operations/sessions/[id]
 * Full answer breakdown for a single exam session. Split from the list
 * endpoint to keep the per-page payload small — answers are only fetched
 * when the admin actually drills into a row.
 */
export const GET = withErrorHandler(async (_req: NextRequest, ctx?: RouteContext) => {
  await requireStaff()
  const { id } = (await ctx!.params) as { id: string }

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
        // questionOrder is Json and cannot be used as Prisma orderBy; answers
        // are returned in insertion order. If a deterministic order is required,
        // sort client-side using the session's questionOrder array.
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

  // Certificates may not be available if the model wasn't generated
  let certificates: {
    id: string
    certificateId: string
    pdfUrl: string | null
    verified: boolean
    issuedAt: Date
  }[] = []
  try {
    certificates = await prismaUnfiltered.certificate.findMany({
      where: { sessionId: s.id },
      select: {
        id: true,
        certificateId: true,
        pdfUrl: true,
        verified: true,
        issuedAt: true,
      },
    })
  } catch {
    // Certificate model may not be in the generated client yet
  }

  const session = s as any

  return apiSuccess({
    id: session.id,
    student: {
      id: session.student.id,
      name: session.student.profile
        ? `${session.student.profile.firstName} ${session.student.profile.lastName}`
        : session.student.email,
      email: session.student.email,
      studentId: session.student.studentProfile?.studentId || null,
    },
    bank: {
      id: session.bank.id,
      name: session.bank.name,
      moduleCode: session.bank.moduleCode,
      courseCode: session.bank.course.code,
    },
    status: session.status,
    startedAt: session.startedAt?.toISOString() || null,
    expiresAt: session.expiresAt?.toISOString() || null,
    submittedAt: session.submittedAt?.toISOString() || null,
    score: session.score,
    totalPoints: session.totalPoints,
    percentage: session.percentage,
    passed: session.passed,
    isPublished: session.isPublished,
    autoSubmitted: session.autoSubmitted,
    voidedAt: session.voidedAt?.toISOString() || null,
    voidReason: session.voidReason,
    answers: session.answers.map(
      (a: {
        id: string
        questionId: string
        question: {
          text?: string
          syllabusRef?: string | null
          options?: unknown
          correctAnswer?: string
          points?: number
        } | null
        selectedAnswer?: string | null
        isCorrect?: boolean | null
        pointsAwarded?: number | null
        answeredAt?: Date | null
      }) => ({
        id: a.id,
        questionId: a.questionId,
        questionText: a.question?.text || 'Question text unavailable',
        questionRef: a.question?.syllabusRef || null,
        options: a.question?.options || [],
        correctAnswer: a.question?.correctAnswer || '',
        selectedAnswer: a.selectedAnswer,
        isCorrect: a.isCorrect,
        points: a.question?.points || 0,
        pointsAwarded: a.pointsAwarded,
        answeredAt: a.answeredAt?.toISOString() || null,
      })
    ),
    reports: session.reports.map(
      (r: {
        id: string
        reason?: string
        status?: string
        createdAt: Date
        questionId?: string
        question?: { syllabusRef?: string | null } | null
      }) => ({
        id: r.id,
        reason: r.reason,
        status: r.status,
        createdAt: r.createdAt.toISOString(),
        questionId: r.questionId,
        questionRef: r.question?.syllabusRef ?? null,
      })
    ),
    certificates: certificates.map((c) => ({
      id: c.id,
      certificateId: c.certificateId,
      pdfUrl: c.pdfUrl,
      verified: c.verified,
      issuedAt: c.issuedAt.toISOString(),
    })),
  })
})
