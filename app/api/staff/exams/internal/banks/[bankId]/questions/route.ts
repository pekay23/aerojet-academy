import { NextRequest } from 'next/server'
import { getAuthSession } from '@/lib/auth/helpers'
import { apiSuccess, apiError, apiCreated, withErrorHandler, RouteContext } from '@/lib/api/response'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { isInternalExamSystemEnabled } from '@/lib/internal-exam/engine'
import { z } from 'zod'
import { Prisma, QuestionStatus } from '@prisma/client'

const questionSchema = z.object({
  text: z.string().min(1),
  options: z.array(z.string()).min(3).max(3), // EASA: exactly 3 options
  correctAnswer: z.string(),
  subTopic: z.string().optional(),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).default('MEDIUM'),
  points: z.number().min(1).default(1),
  syllabusRef: z.string().optional(),
  knowledgeLevel: z.number().int().min(1).max(3).optional(),
  explanation: z.string().optional(),
}).refine(data => data.options.includes(data.correctAnswer), {
  message: 'correctAnswer must be one of the provided options',
  path: ['correctAnswer'],
}).refine(data => data.options.includes(data.correctAnswer), {
  message: 'correctAnswer must be one of the provided options',
  path: ['correctAnswer'],
})

// GET — list questions for a bank
export const GET = withErrorHandler(async (req: NextRequest, ctx: RouteContext<{ bankId: string }>) => {
  const session = await getAuthSession()
  if (!session || !['ADMIN', 'SUPER_ADMIN', 'STAFF', 'EXAMINER', 'INSTRUCTOR'].includes(session.user.role)) {
    return apiError('Unauthorized', 403)
  }
  if (!(await isInternalExamSystemEnabled())) {
    return apiError('Internal exams are not currently available', 403)
  }
  const { bankId } = await ctx.params
  
  const url = new URL(req.url)
  const status = url.searchParams.get('status')
  
  const where: Prisma.InternalExamQuestionWhereInput = { bankId }
  if (status) where.status = status as QuestionStatus

  const questions = await prismaUnfiltered.internalExamQuestion.findMany({
    where,
    orderBy: [{ subTopic: 'asc' }, { syllabusRef: 'asc' }, { sortOrder: 'asc' }, { createdAt: 'desc' }],
  })

  return apiSuccess(questions)
})

// POST — add question to bank
export const POST = withErrorHandler(async (req: NextRequest, ctx: RouteContext<{ bankId: string }>) => {
  const session = await getAuthSession()
  if (!session || !['ADMIN', 'SUPER_ADMIN', 'STAFF', 'EXAMINER', 'INSTRUCTOR'].includes(session.user.role)) {
    return apiError('Unauthorized', 403)
  }
  if (!(await isInternalExamSystemEnabled())) {
    return apiError('Internal exams are not currently available', 403)
  }
  const { bankId } = await ctx.params
  const body = await req.json()

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
        message: parsed.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join('; '),
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

  return apiCreated({ count: created.length, errors, questions: created })
})
