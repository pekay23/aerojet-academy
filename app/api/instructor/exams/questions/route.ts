import { NextRequest } from 'next/server'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { requireInstructor } from '@/lib/auth/helpers'
import { apiPaginated, apiError, apiForbidden, withErrorHandler } from '@/lib/api/response'
import { parsePagination } from '@/lib/api/response'
import { getInstructorProfileByUserId } from '@/lib/instructor/profile'
import { isInternalExamSystemEnabled } from '@/lib/internal-exam/engine'
import { z } from 'zod'

const QUESTION_STATUS_VALUES = ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED'] as const

export const GET = withErrorHandler(async (req: NextRequest) => {
  const user = await requireInstructor()
  const instructorProfile = await getInstructorProfileByUserId(user.id)
  if (!instructorProfile) return apiForbidden('Instructor profile not found')

  if (!(await isInternalExamSystemEnabled())) {
    return apiError('Internal exams are not currently available', 403)
  }

  const { searchParams } = new URL(req.url)
  const { page, limit, skip } = parsePagination(searchParams)
  const view = searchParams.get('view') || 'mine'
  const bankId = searchParams.get('bankId')
  const status = searchParams.get('status')
  const submittedById = searchParams.get('submittedById')

  let bankIds: string[] = []

  if (view === 'mine') {
    const assignments = await prismaUnfiltered.internalExamBankInstructor.findMany({
      where: { instructorId: instructorProfile.id },
      select: { bankId: true },
    })
    bankIds = assignments.map((a) => a.bankId)
  } else if (view === 'module') {
    const classes = await prismaUnfiltered.class.findMany({
      where: { instructorId: instructorProfile.id },
      select: { courseId: true },
    })
    const courseIds = [...new Set(classes.map((c) => c.courseId))]
    if (courseIds.length > 0) {
      const banks = await prismaUnfiltered.internalExamBank.findMany({
        where: { courseId: { in: courseIds } },
        select: { id: true },
      })
      bankIds = banks.map((b) => b.id)
    }
  }

  if (bankIds.length === 0) {
    return apiPaginated([], 0, page, limit)
  }

  const where: any = { bankId: { in: bankIds } }
  if (bankId) where.bankId = bankId
  if (status) {
    const parsed = z.enum(QUESTION_STATUS_VALUES).safeParse(status)
    if (!parsed.success) {
      return apiError(`Invalid status; must be one of ${QUESTION_STATUS_VALUES.join(' | ')}`, 400)
    }
    where.status = parsed.data
  }
  if (submittedById) where.submittedById = submittedById
  if (view === 'mine') where.submittedById = user.id

  const [rawQuestions, total] = await Promise.all([
    prismaUnfiltered.internalExamQuestion.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip,
      include: {
        bank: { select: { id: true, name: true } },
      },
    }),
    prismaUnfiltered.internalExamQuestion.count({ where }),
  ])

  const authorIds = Array.from(
    new Set(rawQuestions.map((q) => q.submittedById).filter((id): id is string => Boolean(id)))
  )
  const authors = authorIds.length
    ? await prismaUnfiltered.user.findMany({
        where: { id: { in: authorIds } },
        select: { id: true, name: true, profile: { select: { firstName: true, lastName: true } } },
      })
    : []
  const authorMap = new Map(authors.map((a) => [a.id, a]))

  const questions = rawQuestions.map((q) => ({
    ...q,
    submittedBy: q.submittedById ? authorMap.get(q.submittedById) ?? null : null,
  }))

  return apiPaginated(questions, total, page, limit)
})
