import { NextRequest } from 'next/server'
import { Prisma } from '@prisma/client'
import { requireInstructor } from '@/lib/auth/helpers'
import {
  apiError,
  apiCreated,
  apiForbidden,
  apiPaginated,
  withErrorHandler,
  RouteContext,
  parsePagination,
} from '@/lib/api/response'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { isInternalExamSystemEnabled } from '@/lib/internal-exam/engine'
import { AuditAction, createAuditLog } from '@/lib/audit/logger'
import { getInstructorProfileByUserId } from '@/lib/instructor/profile'
import { z } from 'zod'

const questionSchema = z
  .object({
    text: z.string().trim().min(1),
    options: z.array(z.string().trim().min(1)).min(3).max(3),
    correctAnswer: z.string().trim().min(1),
    subTopic: z.string().optional(),
    difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).default('MEDIUM'),
    points: z.number().min(1).default(1),
    syllabusRef: z.string().optional(),
    knowledgeLevel: z.number().int().min(1).max(3).optional(),
    explanation: z.string().optional(),
  })
  .superRefine((data, context) => {
    if (new Set(data.options).size !== data.options.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Options must be unique',
        path: ['options'],
      })
    }
    if (!data.options.includes(data.correctAnswer)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'correctAnswer must be one of the provided options',
        path: ['correctAnswer'],
      })
    }
  })

const QUESTION_STATUS_VALUES = ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED'] as const
const SORT_VALUES = [
  'recent',
  'oldest',
  'author',
  'difficulty_desc',
  'difficulty_asc',
  'status',
  'subtopic',
  'served',
] as const
type QuestionSort = (typeof SORT_VALUES)[number]
type QuestionInput = z.infer<typeof questionSchema>

const DIFFICULTY_RANK: Record<string, number> = { EASY: 1, MEDIUM: 2, HARD: 3 }

function formatValidationErrors(error: z.ZodError): string {
  return error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ')
}

function normalizeQuestionStem(text: string): string {
  return text.trim().replace(/\s+/g, ' ').toLowerCase()
}

function findDuplicateStemErrors(
  items: QuestionInput[],
  existingQuestions: Array<{ id: string; text: string }>
): Array<{ row: number; message: string }> {
  const existingStems = new Map(
    existingQuestions.map((question) => [normalizeQuestionStem(question.text), question.id])
  )
  const firstBatchRow = new Map<string, number>()
  const errors: Array<{ row: number; message: string }> = []

  items.forEach((item, index) => {
    const row = index + 1
    const stem = normalizeQuestionStem(item.text)
    const firstRow = firstBatchRow.get(stem)
    if (firstRow) {
      errors.push({
        row,
        message: `Duplicate question stem in batch (first appears in row ${firstRow})`,
      })
    } else {
      firstBatchRow.set(stem, row)
    }
    if (existingStems.has(stem)) {
      errors.push({ row, message: 'Question stem already exists in this bank' })
    }
  })

  return errors
}

function parseQuestionBatch(body: unknown): {
  items: QuestionInput[]
  errors: Array<{ row: number; message: string }>
} {
  const items = Array.isArray(body) ? body : [body]
  if (items.length === 0) {
    return { items: [], errors: [{ row: 1, message: 'At least one question is required' }] }
  }
  if (items.length > 100) {
    return { items: [], errors: [{ row: 0, message: 'Maximum 100 questions per import' }] }
  }

  const parsedItems: QuestionInput[] = []
  const errors: Array<{ row: number; message: string }> = []
  items.forEach((item, index) => {
    const parsed = questionSchema.safeParse(item)
    if (!parsed.success) {
      errors.push({ row: index + 1, message: formatValidationErrors(parsed.error) })
      return
    }
    parsedItems.push(parsed.data)
  })

  return { items: parsedItems, errors }
}

async function createQuestionBatch(input: {
  bankId: string
  items: QuestionInput[]
  submittedById: string
}) {
  const [bank, existingQuestions, maxSortOrderQuestion] = await Promise.all([
    prismaUnfiltered.internalExamBank.findUnique({
      where: { id: input.bankId },
      select: { id: true },
    }),
    prismaUnfiltered.internalExamQuestion.findMany({
      where: { bankId: input.bankId },
      select: { id: true, text: true },
    }),
    prismaUnfiltered.internalExamQuestion.findFirst({
      where: { bankId: input.bankId },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    }),
  ])

  if (!bank) return { kind: 'notFound' as const }

  const duplicateErrors = findDuplicateStemErrors(input.items, existingQuestions)
  if (duplicateErrors.length > 0) {
    return { kind: 'duplicate' as const, errors: duplicateErrors }
  }

  const baseSortOrder = maxSortOrderQuestion?.sortOrder ?? 0
  const questions = await prismaUnfiltered.$transaction(async (tx) =>
    Promise.all(
      input.items.map((item, index) =>
        tx.internalExamQuestion.create({
          data: {
            bankId: input.bankId,
            text: item.text,
            options: item.options,
            correctAnswer: item.correctAnswer,
            subTopic: item.subTopic?.trim() || null,
            difficulty: item.difficulty,
            points: item.points,
            syllabusRef: item.syllabusRef?.trim() || null,
            knowledgeLevel: item.knowledgeLevel ?? null,
            explanation: item.explanation?.trim() || null,
            status: 'PENDING_APPROVAL',
            submittedById: input.submittedById,
            sortOrder: baseSortOrder + index + 1,
          },
        })
      )
    )
  )

  return { kind: 'created' as const, questions }
}

export const GET = withErrorHandler(
  async (req: NextRequest, ctx: RouteContext<{ bankId: string }>) => {
    const user = await requireInstructor()
    const instructorProfile = await getInstructorProfileByUserId(user.id)
    if (!instructorProfile) return apiForbidden('Instructor profile not found')

    if (!(await isInternalExamSystemEnabled())) {
      return apiError('Internal exams are not currently available', 403)
    }
    const { bankId } = await ctx.params

    const grant = await prismaUnfiltered.internalExamBankInstructor.findFirst({
      where: { bankId, instructorId: instructorProfile.id },
      select: { canMonitor: true, canEdit: true },
    })
    if (!grant?.canMonitor && !grant?.canEdit) {
      return apiForbidden('You do not have access to this bank')
    }

    const searchParams = new URL(req.url).searchParams
    const { page, limit, skip } = parsePagination(searchParams)
    const statusParam = searchParams.get('status')
    let statusValue: (typeof QUESTION_STATUS_VALUES)[number] | undefined
    if (statusParam) {
      const parsed = z.enum(QUESTION_STATUS_VALUES).safeParse(statusParam)
      if (!parsed.success) {
        return apiError(`Invalid status; must be one of ${QUESTION_STATUS_VALUES.join(' | ')}`, 400)
      }
      statusValue = parsed.data
    }

    const sortParam = searchParams.get('sort') || 'recent'
    if (!SORT_VALUES.includes(sortParam as QuestionSort)) {
      return apiError(`Invalid sort; must be one of ${SORT_VALUES.join(' | ')}`, 400)
    }
    const sort = sortParam as QuestionSort

    const where: Prisma.InternalExamQuestionWhereInput = {
      bankId,
      ...(statusValue ? { status: statusValue } : {}),
    }

    const orderBy: Prisma.InternalExamQuestionOrderByWithRelationInput[] =
      sort === 'recent'
        ? [{ createdAt: 'desc' }]
        : sort === 'oldest'
          ? [{ createdAt: 'asc' }]
          : sort === 'difficulty_desc'
            ? [{ difficulty: 'desc' }, { createdAt: 'desc' }]
            : sort === 'difficulty_asc'
              ? [{ difficulty: 'asc' }, { createdAt: 'desc' }]
              : sort === 'served'
                ? [{ timesServed: 'desc' }, { createdAt: 'desc' }]
                : [{ createdAt: 'desc' }]

    const [questions, total] = await Promise.all([
      prismaUnfiltered.internalExamQuestion.findMany({ where, orderBy, skip, take: limit }),
      prismaUnfiltered.internalExamQuestion.count({ where }),
    ])

    const submitterIds = Array.from(
      new Set(
        questions
          .map((question) => question.submittedById)
          .filter((id): id is string => Boolean(id))
      )
    )
    const submitters = submitterIds.length
      ? await prismaUnfiltered.user.findMany({
          where: { id: { in: submitterIds } },
          select: {
            id: true,
            profile: { select: { firstName: true, lastName: true } },
          },
        })
      : []
    const submitterMap = new Map(submitters.map((submitter) => [submitter.id, submitter]))

    const enriched = questions.map((question) => ({
      ...question,
      submittedBy: question.submittedById
        ? (submitterMap.get(question.submittedById) ?? null)
        : null,
    }))

    if (sort === 'author') {
      const authorKey = (question: (typeof enriched)[number]) =>
        [question.submittedBy?.profile?.firstName, question.submittedBy?.profile?.lastName]
          .filter(Boolean)
          .join(' ') || 'zzz'
      enriched.sort((a, b) => {
        const comparison = authorKey(a).localeCompare(authorKey(b), undefined, {
          sensitivity: 'base',
        })
        if (comparison !== 0) return comparison
        return b.createdAt.getTime() - a.createdAt.getTime()
      })
    } else if (sort === 'status') {
      const order: Record<string, number> = {
        DRAFT: 0,
        PENDING_APPROVAL: 1,
        APPROVED: 2,
        REJECTED: 3,
      }
      enriched.sort((a, b) => {
        const comparison = (order[a.status] ?? 99) - (order[b.status] ?? 99)
        if (comparison !== 0) return comparison
        return b.createdAt.getTime() - a.createdAt.getTime()
      })
    } else if (sort === 'subtopic') {
      enriched.sort((a, b) => {
        const aHas = a.subTopic ? 0 : 1
        const bHas = b.subTopic ? 0 : 1
        if (aHas !== bHas) return aHas - bHas
        const comparison = (a.subTopic ?? '').localeCompare(b.subTopic ?? '', undefined, {
          sensitivity: 'base',
        })
        if (comparison !== 0) return comparison
        return b.createdAt.getTime() - a.createdAt.getTime()
      })
    } else if (sort === 'difficulty_desc' || sort === 'difficulty_asc') {
      enriched.sort((a, b) => {
        const aRank = DIFFICULTY_RANK[a.difficulty] ?? 99
        const bRank = DIFFICULTY_RANK[b.difficulty] ?? 99
        const comparison = sort === 'difficulty_desc' ? bRank - aRank : aRank - bRank
        if (comparison !== 0) return comparison
        return b.createdAt.getTime() - a.createdAt.getTime()
      })
    }

    const visibleQuestions = grant.canEdit
      ? enriched
      : enriched.map((question) => {
          const { correctAnswer: _correctAnswer, ...rest } = question
          return rest
        })

    return apiPaginated(visibleQuestions, total, page, limit)
  }
)

export const POST = withErrorHandler(
  async (req: NextRequest, ctx: RouteContext<{ bankId: string }>) => {
    const user = await requireInstructor()
    const instructorProfile = await getInstructorProfileByUserId(user.id)
    if (!instructorProfile) return apiForbidden('Instructor profile not found')

    if (!(await isInternalExamSystemEnabled())) {
      return apiError('Internal exams are not currently available', 403)
    }
    const { bankId } = await ctx.params

    const grant = await prismaUnfiltered.internalExamBankInstructor.findFirst({
      where: { bankId, instructorId: instructorProfile.id },
      select: { canEdit: true },
    })
    if (!grant?.canEdit) {
      return apiForbidden('You do not have permission to add questions to this bank')
    }

    const body = await req.json()
    const parsedBatch = parseQuestionBatch(body)
    if (parsedBatch.errors.length > 0) {
      return apiError('Invalid question data', 400, { errors: parsedBatch.errors })
    }

    const result = await createQuestionBatch({
      bankId,
      items: parsedBatch.items,
      submittedById: user.id,
    })
    if (result.kind === 'notFound') return apiError('Bank not found', 404)
    if (result.kind === 'duplicate') {
      return apiError('Question stems must be unique within a bank', 409, { errors: result.errors })
    }

    await createAuditLog({
      userId: user.id,
      action: Array.isArray(body)
        ? AuditAction.EXAM_QUESTION_IMPORT
        : AuditAction.EXAM_QUESTION_CREATED,
      entity: 'InternalExamQuestion',
      entityId: result.questions[0]?.id || bankId,
      description: `Imported ${result.questions.length} question(s) into bank ${bankId}`,
      changes: {
        bankId,
        count: result.questions.length,
        questionIds: result.questions.map((q) => q.id),
      },
    })

    return Array.isArray(body)
      ? apiCreated({ count: result.questions.length, errors: [], questions: result.questions })
      : apiCreated(result.questions[0])
  }
)
