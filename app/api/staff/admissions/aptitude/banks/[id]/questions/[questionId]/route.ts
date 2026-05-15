import { NextRequest } from 'next/server'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { z } from 'zod'

const updateQuestionSchema = z.object({
  category: z.enum(['MATH', 'ENGLISH', 'ENGINEERING', 'LOGICAL_REASONING', 'PHYSICS']).optional(),
  questionType: z.enum(['MCQ', 'NUMERIC_INPUT', 'TRUE_FALSE']).optional(),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).optional(),
  text: z.string().min(1).optional(),
  options: z.any().optional(),
  correctAnswer: z.string().min(1).optional(),
  points: z.number().int().min(1).optional(),
  explanation: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
})

// PUT /api/staff/admissions/aptitude/banks/[id]/questions/[questionId]
export const PUT = withErrorHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string; questionId: string }> }) => {
  await requireStaff()
  const { id, questionId } = await params
  const body = await req.json()
  
  const parsed = updateQuestionSchema.safeParse(body)
  if (!parsed.success) return apiError(parsed.error.issues[0].message)

  try {
    const question = await prismaUnfiltered.aptitudeQuestion.update({
      where: { id: questionId, bankId: id },
      data: parsed.data as any,
    })
    return apiSuccess(question)
  } catch (error: any) {
    if (error.code === 'P2025') return apiError('Question not found', 404)
    throw error
  }
})

// DELETE /api/staff/admissions/aptitude/banks/[id]/questions/[questionId]
export const DELETE = withErrorHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string; questionId: string }> }) => {
  await requireStaff()
  const { id, questionId } = await params

  // Check if question has answers in sessions
  const question = await prismaUnfiltered.aptitudeQuestion.findUnique({
    where: { id: questionId, bankId: id },
    include: { _count: { select: { answers: true } } },
  })

  if (!question) return apiError('Question not found', 404)
  if (question._count.answers > 0) {
    // Soft delete instead if used
    const updated = await prismaUnfiltered.aptitudeQuestion.update({
      where: { id: questionId },
      data: { isActive: false },
    })
    return apiSuccess(updated)
  }

  await prismaUnfiltered.aptitudeQuestion.delete({
    where: { id: questionId, bankId: id },
  })

  return apiSuccess({ deleted: true })
})
