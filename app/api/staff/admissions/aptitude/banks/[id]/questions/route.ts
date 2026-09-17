import { NextRequest } from 'next/server'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiCreated, apiError, withErrorHandler , RouteContext } from '@/lib/api/response'
import { z } from 'zod'
import { Prisma } from '@prisma/client'

const questionSchema = z.object({
  category: z.enum(['MATH', 'ENGLISH', 'ENGINEERING', 'LOGICAL_REASONING', 'PHYSICS']),
  questionType: z.enum(['MCQ', 'NUMERIC_INPUT', 'TRUE_FALSE']),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).default('MEDIUM'),
  text: z.string().min(1),
  options: z.any().optional(), // Should be JSON array or object
  correctAnswer: z.string().min(1),
  points: z.number().int().min(1).default(1),
  explanation: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
})

// GET /api/staff/admissions/aptitude/banks/[id]/questions
export const GET = withErrorHandler(async (req: NextRequest, ctx?: RouteContext) => {
  await requireStaff()
  const { id } = (await ctx!.params) as { id: string }

  const questions = await prismaUnfiltered.aptitudeQuestion.findMany({
    where: { bankId: id },
    orderBy: { createdAt: 'desc' },
    take: 500, // Reasonable limit
  })

  return apiSuccess(questions)
})

// POST /api/staff/admissions/aptitude/banks/[id]/questions
export const POST = withErrorHandler(async (req: NextRequest, ctx?: RouteContext) => {
  await requireStaff()
  const { id } = (await ctx!.params) as { id: string }
  const body = await req.json()
  const parsed = questionSchema.safeParse(body)
  if (!parsed.success) return apiError(parsed.error.issues[0].message)

  // Verify bank exists
  const bank = await prismaUnfiltered.aptitudeTestBank.findUnique({ where: { id } })
  if (!bank) return apiError('Bank not found', 404)

  const question = await prismaUnfiltered.aptitudeQuestion.create({
    data: {
      ...parsed.data,
      bankId: id,
     } as Prisma.AptitudeQuestionUncheckedCreateInput,
  })

  return apiCreated(question)
})
