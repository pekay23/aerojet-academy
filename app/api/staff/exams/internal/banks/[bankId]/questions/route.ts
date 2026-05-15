import { NextRequest } from 'next/server'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiError, apiCreated, withErrorHandler } from '@/lib/api/response'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { isInternalExamSystemEnabled } from '@/lib/internal-exam/engine'
import { z } from 'zod'

const questionSchema = z.object({
  text: z.string().min(1),
  options: z.array(z.string()).min(3).max(3), // EASA: exactly 3 options
  correctAnswer: z.string(),
  subTopic: z.string().optional(),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).default('MEDIUM'),
  points: z.number().min(1).default(1),
})

// GET — list questions for a bank
export const GET = withErrorHandler(async (req: NextRequest, ctx: any) => {
  await requireStaff()
  if (!(await isInternalExamSystemEnabled())) {
    return apiError('Internal exams are not currently available', 403)
  }
  const { bankId } = await ctx.params

  const questions = await prismaUnfiltered.internalExamQuestion.findMany({
    where: { bankId },
    orderBy: [{ subTopic: 'asc' }, { sortOrder: 'asc' }, { createdAt: 'desc' }],
  })

  return apiSuccess(questions)
})

// POST — add question to bank
export const POST = withErrorHandler(async (req: NextRequest, ctx: any) => {
  await requireStaff()
  if (!(await isInternalExamSystemEnabled())) {
    return apiError('Internal exams are not currently available', 403)
  }
  const { bankId } = await ctx.params
  const body = await req.json()

  // Support bulk import with row-level error reporting
  const items = Array.isArray(body) ? body : [body]
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
        difficulty: parsed.data.difficulty as any,
        points: parsed.data.points,
      },
    })
    created.push(q)
  }

  return apiCreated({ count: created.length, errors, questions: created })
})
