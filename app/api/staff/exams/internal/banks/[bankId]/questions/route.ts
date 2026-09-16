import { NextRequest } from 'next/server'
import { getAuthSession } from '@/lib/auth/helpers'
import {
  apiError,
  apiSuccess,
  apiCreated,
  apiPaginated,
  withErrorHandler,
  RouteContext,
  parsePagination,
} from '@/lib/api/response'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { isInternalExamSystemEnabled } from '@/lib/internal-exam/engine'
import { getInstructorProfileByUserId } from '@/lib/instructor/profile'
import { createAuditLog, AuditAction } from '@/lib/audit/logger'
import { z } from 'zod'
import { Prisma, QuestionStatus } from '@prisma/client'

const QUESTION_STATUS_VALUES = ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED'] as const
const STAFF_SORT_VALUES = ['default', 'dateAdded', 'category', 'syllabusRef', 'difficulty'] as const

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

const reorderSchema = z.object({
  questionId: z.string().trim().min(1),
  direction: z.enum(['up', 'down']),
})

type QuestionInput = z.infer<typeof questionSchema>

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

async function createQuestionBatch(input: {
  bankId: string
  items: QuestionInput[]
  submittedById: string
}): Promise<
  | { kind: 'notFound' }
  | { kind: 'duplicate'; errors: Array<{ row: number; message: string }> }
  | { kind: 'created'; questions: Array<{ id: string }> }
> {
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

  if (!bank) return { kind: 'notFound' }

  const duplicateErrors = findDuplicateStemErrors(input.items, existingQuestions)
  if (duplicateErrors.length > 0) return { kind: 'duplicate', errors: duplicateErrors }

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

  return { kind: 'created', questions }
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

async function resolveInstructorBankAccess(
  bankId: string,
  instructorId: string
): Promise<{ canEdit: boolean; canReview: boolean; canMonitor: boolean } | null> {
  const profile = await getInstructorProfileByUserId(instructorId)
  if (!profile) return null

  const grant = await prismaUnfiltered.internalExamBankInstructor.findFirst({
    where: { bankId, instructorId: profile.id },
    select: { canEdit: true, canReview: true, canMonitor: true },
  })
  return grant ?? null
}

function stripCorrectAnswer(questions: unknown[], hide: boolean) {
  if (!hide) return questions
  return questions.map((question) => {
    const record = question as Record<string, unknown>
    const { correctAnswer: _correctAnswer, ...rest } = record
    return rest
  })
}

export const GET = withErrorHandler(
  async (req: NextRequest, ctx: RouteContext<{ bankId: string }>) => {
    const session = await getAuthSession()
    if (
      !session ||
      !['ADMIN', 'SUPER_ADMIN', 'STAFF', 'EXAMINER', 'INSTRUCTOR'].includes(session.user.role)
    ) {
      return apiError('Unauthorized', 403)
    }
    if (!(await isInternalExamSystemEnabled())) {
      return apiError('Internal exams are not currently available', 403)
    }
    const { bankId } = await ctx.params

    const isInstructor = session.user.role === 'INSTRUCTOR'
    let canEdit = false
    if (isInstructor) {
      const grant = await resolveInstructorBankAccess(bankId, session.user.id)
      if (!grant || !(grant.canMonitor || grant.canReview || grant.canEdit)) {
        return apiError('You do not have access to this bank', 403)
      }
      canEdit = grant.canEdit
    }

    const searchParams = new URL(req.url).searchParams
    const { page, limit, skip } = parsePagination(searchParams)
    const statusParam = searchParams.get('status')
    let statusValue: QuestionStatus | undefined
    if (statusParam) {
      const parsed = z.enum(QUESTION_STATUS_VALUES).safeParse(statusParam)
      if (!parsed.success) {
        return apiError(`Invalid status; must be one of ${QUESTION_STATUS_VALUES.join(' | ')}`, 400)
      }
      statusValue = parsed.data
    }

    const sortParam = searchParams.get('sort') || 'default'
    if (!STAFF_SORT_VALUES.includes(sortParam as (typeof STAFF_SORT_VALUES)[number])) {
      return apiError(`Invalid sort; must be one of ${STAFF_SORT_VALUES.join(' | ')}`, 400)
    }

    const where: Prisma.InternalExamQuestionWhereInput = { bankId }
    if (statusValue) where.status = statusValue

    let orderBy: Prisma.InternalExamQuestionOrderByWithRelationInput[] = [
      { subTopic: 'asc' },
      { syllabusRef: 'asc' },
      { sortOrder: 'asc' },
      { createdAt: 'desc' },
    ]
    if (sortParam === 'dateAdded') {
      orderBy = [{ createdAt: 'desc' }]
    } else if (sortParam === 'category') {
      orderBy = [{ subTopic: 'asc' }, { syllabusRef: 'asc' }, { sortOrder: 'asc' }]
    } else if (sortParam === 'syllabusRef') {
      orderBy = [{ syllabusRef: 'asc' }, { sortOrder: 'asc' }]
    } else if (sortParam === 'difficulty') {
      orderBy = [{ difficulty: 'asc' }, { sortOrder: 'asc' }]
    }

    const [questions, total] = await Promise.all([
      prismaUnfiltered.internalExamQuestion.findMany({ where, orderBy, skip, take: limit }),
      prismaUnfiltered.internalExamQuestion.count({ where }),
    ])

    return apiPaginated(stripCorrectAnswer(questions, isInstructor && !canEdit), total, page, limit)
  }
)

export const POST = withErrorHandler(
  async (req: NextRequest, ctx: RouteContext<{ bankId: string }>) => {
    const session = await getAuthSession()
    if (
      !session ||
      !['ADMIN', 'SUPER_ADMIN', 'STAFF', 'EXAMINER', 'INSTRUCTOR'].includes(session.user.role)
    ) {
      return apiError('Unauthorized', 403)
    }
    if (!(await isInternalExamSystemEnabled())) {
      return apiError('Internal exams are not currently available', 403)
    }
    const { bankId } = await ctx.params

    const isInstructor = session.user.role === 'INSTRUCTOR'
    if (isInstructor) {
      const grant = await resolveInstructorBankAccess(bankId, session.user.id)
      if (!grant?.canEdit) {
        return apiError('You do not have permission to add questions to this bank', 403)
      }
    }

    const body = await req.json()
    const parsedBatch = parseQuestionBatch(body)
    if (parsedBatch.errors.length > 0) {
      return apiError('Invalid question data', 400, { errors: parsedBatch.errors })
    }

    const result = await createQuestionBatch({
      bankId,
      items: parsedBatch.items,
      submittedById: session.user.id,
    })
    if (result.kind === 'notFound') return apiError('Bank not found', 404)
    if (result.kind === 'duplicate') {
      return apiError('Question stems must be unique within a bank', 409, { errors: result.errors })
    }

    await createAuditLog({
      userId: session.user.id,
      action: AuditAction.EXAM_QUESTION_IMPORT,
      entity: 'InternalExamQuestion',
      entityId: result.questions[0]?.id || bankId,
      description: `Imported ${result.questions.length} question(s) into bank ${bankId}`,
      changes: {
        bankId,
        count: result.questions.length,
        questionIds: result.questions.map((q) => q.id),
      },
    })

    return apiCreated({ count: result.questions.length, errors: [], questions: result.questions })
  }
)

export const PATCH = withErrorHandler(
  async (req: NextRequest, ctx: RouteContext<{ bankId: string }>) => {
    const session = await getAuthSession()
    if (!session || !['ADMIN', 'SUPER_ADMIN', 'STAFF'].includes(session.user.role)) {
      return apiError('Unauthorized', 403)
    }
    if (!(await isInternalExamSystemEnabled())) {
      return apiError('Internal exams are not currently available', 403)
    }
    const { bankId } = await ctx.params
    const parsed = reorderSchema.safeParse(await req.json())
    if (!parsed.success) {
      return apiError(formatValidationErrors(parsed.error), 400)
    }

    const activeQuestions = await prismaUnfiltered.internalExamQuestion.findMany({
      where: { bankId, isActive: true },
      select: { id: true, sortOrder: true, createdAt: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    })
    const targetIndex = activeQuestions.findIndex(
      (question) => question.id === parsed.data.questionId
    )
    if (targetIndex < 0) return apiError('Active question not found in this bank', 404)

    const destinationIndex = parsed.data.direction === 'up' ? targetIndex - 1 : targetIndex + 1
    if (destinationIndex < 0 || destinationIndex >= activeQuestions.length) {
      return apiSuccess({ questionIds: activeQuestions.map((question) => question.id) })
    }

    const orderedQuestions = [...activeQuestions]
    const [target] = orderedQuestions.splice(targetIndex, 1)
    orderedQuestions.splice(destinationIndex, 0, target)

    await prismaUnfiltered.$transaction(async (tx) =>
      Promise.all(
        orderedQuestions.map((question, index) =>
          tx.internalExamQuestion.update({
            where: { id: question.id },
            data: { sortOrder: index + 1 },
          })
        )
      )
    )

    return apiSuccess({ questionIds: orderedQuestions.map((question) => question.id) })
  }
)
