import { NextRequest } from 'next/server'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { prismaUnfiltered } from '@/lib/prisma/client'

/**
 * GET /api/exams/proctoring/violations
 *
 * Lists all exam violations for proctor review.
 * Supports filtering by session, student, severity, and review status.
 */
export const GET = withErrorHandler(async (req: NextRequest) => {
  const url = new URL(req.url)
  const sessionId = url.searchParams.get('sessionId')
  const studentId = url.searchParams.get('studentId')
  const severity = url.searchParams.get('severity')
  const reviewed = url.searchParams.get('reviewed')
  const page = parseInt(url.searchParams.get('page') || '1')
  const limit = parseInt(url.searchParams.get('limit') || '50')

  const where: any = {}
  if (sessionId) where.sessionId = sessionId
  if (studentId) where.studentId = studentId
  if (severity) where.severity = severity
  if (reviewed !== null) where.reviewedAt = reviewed === 'true' ? { not: null } : null

  const [violations, total] = await Promise.all([
    prismaUnfiltered.internalExamViolation.findMany({
      where,
      include: {
        session: { select: { id: true, bankId: true, studentId: true } },
        student: { select: { firstName: true, lastName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prismaUnfiltered.internalExamViolation.count({ where }),
  ])

  return apiSuccess({
    violations,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  })
})
