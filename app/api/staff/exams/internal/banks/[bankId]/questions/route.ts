import { NextRequest } from 'next/server'
import { getAuthSession } from '@/lib/auth/helpers'
import {
  apiError,
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

const questionSchema = z
  .object({
    text: z.string().min(1),
    options: z.array(z.string()).min(3).max(3), // EASA: exactly 3 options
    correctAnswer: z.string(),
    subTopic: z.string().optional(),
    difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).default('MEDIUM'),
    points: z.number().min(1).default(1),
    syllabusRef: z.string().optional(),
    knowledgeLevel: z.number().int().min(1).max(3).optional(),
    explanation: z.string().optional(),
  })
  .refine((data) => data.options.includes(data.correctAnswer), {
    message: 'correctAnswer must be one of the provided options',
    path: ['correctAnswer'],
  })

async function resolveInstructorBankAccess(
  bankId: string,
  instructorId: string,
): Promise<{ canEdit: boolean; canReview: boolean; canMonitor: boolean } | null> {
  const profile = await getInstructorProfileByUserId(instructorId)
  if (!profile) return null

  const grant = await prismaUnfiltered.internalExamBankInstructor.findFirst({
    where: { bankId, instructorId: profile.id },
    select: { canEdit: true, canReview: true, canMonitor: true },
  })
  return grant ?? null
}

async function stripCorrectAnswer(questions: unknown[], hide: boolean) {
  if (!hide) return questions
  return questions.map((q) => {
    const obj = q as Record<string, unknown>
    const { correctAnswer: _, ...rest } = obj
    return rest
  })
}

// GET — list questions for a bank
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

    const url = new URL(req.url)
    const searchParams = url.searchParams
    const { page, limit, skip } = parsePagination(searchParams)
    const status = searchParams.get('status')
    const sort = searchParams.get('sort') || 'default'

    const where: Prisma.InternalExamQuestionWhereInput = { bankId }
    if (status) where.status = status as QuestionStatus

    let orderBy: Prisma.InternalExamQuestionOrderByWithRelationInput[] = [
      { subTopic: 'asc' },
      { syllabusRef: 'asc' },
      { sortOrder: 'asc' },
      { createdAt: 'desc' },
    ]
    if (sort === 'dateAdded') {
      orderBy = [{ createdAt: 'desc' }]
    } else if (sort === 'category') {
      orderBy = [{ subTopic: 'asc' }, { syllabusRef: 'asc' }, { sortOrder: 'asc' }]
    } else if (sort === 'syllabusRef') {
      orderBy = [{ syllabusRef: 'asc' }, { sortOrder: 'asc' }]
    } else if (sort === 'difficulty') {
      orderBy = [{ difficulty: 'asc' }, { sortOrder: 'asc' }]
    }

    const [questions, total] = await Promise.all([
      prismaUnfiltered.internalExamQuestion.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
      prismaUnfiltered.internalExamQuestion.count({ where }),
    ])

    const sanitized = await stripCorrectAnswer(questions, isInstructor && !canEdit)

    return apiPaginated(sanitized, total, page, limit)
  }
)

// POST — add question to bank
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
    const body = await req.json()

    const isInstructor = session.user.role === 'INSTRUCTOR'
    if (isInstructor) {
      const grant = await resolveInstructorBankAccess(bankId, session.user.id)
      if (!grant?.canEdit) {
        return apiError('You do not have permission to add questions to this bank', 403)
      }
    }

    // Support bulk import with row-level error reporting
    const items = Array.isArray(body) ? body : [body]
    if (items.length > 100) {
      return apiError('Maximum 100 questions per import', 400)
    }
    const created = []
    const errors: { row: number; message: string }[] = []

    for (let i = 0; i < items.length; i++) {
      const parsed = questionSchema.safeParse(items[i])
      if (!parsed.success) {
        errors.push({
          row: i + 1,
          message: parsed.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join('; '),
        })
        continue
      }

      const q = await prismaUnfiltered.internalExamQuestion.create({
        data: {
          bankId,
          text: parsed.data.text,
          options: parsed.data.options,
          correctAnswer: parsed.data.correctAnswer,
          subTopic: parsed.data.subTopic || null,
          difficulty: parsed.data.difficulty,
          points: parsed.data.points,
          syllabusRef: parsed.data.syllabusRef || null,
          knowledgeLevel: parsed.data.knowledgeLevel || null,
          explanation: parsed.data.explanation || null,
          status: 'PENDING_APPROVAL',
          submittedById: session.user.id,
        },
      })
      created.push(q)
    }

    await createAuditLog({
      userId: session.user.id,
      action: AuditAction.EXAM_QUESTION_IMPORT,
      entity: 'InternalExamQuestion',
      entityId: created.length > 0 ? created[0].id : bankId,
      description: `Imported ${created.length} question(s) into bank ${bankId}`,
      changes: { bankId, count: created.length, errors },
    })

    return apiCreated({ count: created.length, errors, questions: created })
  }
)
