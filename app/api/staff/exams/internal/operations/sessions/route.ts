import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { prismaUnfiltered } from '@/lib/prisma/client'

const STATUS_VALUES = ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'TIMED_OUT', 'VOIDED'] as const

const querySchema = z.object({
  status: z.enum(STATUS_VALUES).optional(),
  bankId: z.string().min(1).optional(),
})

/**
 * GET /api/staff/exams/internal/operations/sessions
 * Slim list of exam sessions for the admin operations dashboard. Answers
 * and questions are NOT included — drill into a row via
 * `/sessions/[id]` to load the full breakdown. Keeps the page payload
 * small enough for a 15-30s polling cadence.
 */
export const GET = withErrorHandler(async (req: NextRequest) => {
  await requireStaff()

  const url = new URL(req.url)
  const parsed = querySchema.safeParse({
    status: url.searchParams.get('status') ?? undefined,
    bankId: url.searchParams.get('bankId') ?? undefined,
  })
  if (!parsed.success) {
    return apiError(
      `Invalid query: status must be one of ${STATUS_VALUES.join(' | ')}`,
      400
    )
  }
  const { status, bankId } = parsed.data

  const where: Record<string, unknown> = {}
  if (status) where.status = status
  if (bankId) where.bankId = bankId

  const sessions = await prismaUnfiltered.internalExamSession.findMany({
    where,
    select: {
      id: true,
      status: true,
      startedAt: true,
      expiresAt: true,
      submittedAt: true,
      score: true,
      totalPoints: true,
      percentage: true,
      passed: true,
      isPublished: true,
      autoSubmitted: true,
      voidedAt: true,
      voidReason: true,
      student: {
        select: {
          id: true,
          email: true,
          profile: { select: { firstName: true, lastName: true } },
          studentProfile: { select: { studentId: true } },
        },
      },
      bank: {
        select: { id: true, name: true, moduleCode: true, course: { select: { code: true } } },
      },
      // Reports are small — keep them on the list so the unread badge can
      // render without a second fetch. Heavy `answers` lives on the detail
      // endpoint only.
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
      _count: { select: { answers: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
  })

  return apiSuccess(
    sessions.map((s) => ({
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
      answerCount: s._count.answers,
      reports: s.reports.map((r) => ({
        id: r.id,
        reason: r.reason,
        status: r.status,
        createdAt: r.createdAt.toISOString(),
        questionId: r.questionId,
        questionRef: r.question?.syllabusRef ?? null,
      })),
    }))
  )
})
