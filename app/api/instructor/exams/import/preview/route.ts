import 'server-only'

import { NextRequest } from 'next/server'
import { requireInstructor } from '@/lib/auth/helpers'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { z } from 'zod'
import { isInternalExamSystemEnabled } from '@/lib/internal-exam/engine'
import { getInstructorProfileByUserId } from '@/lib/instructor/profile'

const questionSchema = z.object({
  text: z.string().min(1),
  options: z.array(z.string()).min(3).max(3),
  correctAnswer: z.string(),
  subTopic: z.string().optional(),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).optional(),
  points: z.number().min(1).optional(),
  explanation: z.string().optional(),
}).refine((data) => data.options.includes(data.correctAnswer), {
  message: 'correctAnswer must be one of the provided options',
  path: ['correctAnswer'],
})

export const POST = withErrorHandler(async (req: NextRequest) => {
  const user = await requireInstructor()
  const instructorProfile = await getInstructorProfileByUserId(user.id)
  if (!instructorProfile) return apiError('Instructor profile not found', 403)

  if (!(await isInternalExamSystemEnabled())) {
    return apiError('Internal exams are not currently available', 403)
  }

  const body = await req.json()
  const { questions, bankId } = body as { questions: any[]; bankId: string }

  const bank = await prismaUnfiltered.internalExamBank.findFirst({
    where: { id: bankId },
    include: { instructorAssignments: { where: { instructorId: user.id } } },
  })
  if (!bank) return apiError('Bank not found', 404)
  const grant = bank.instructorAssignments.find((a) => a.instructorId === user.id)
  if (!grant?.canEdit) return apiError('You do not have permission to import questions into this bank', 403)

  const preview = questions.map((q, i) => {
    const parsed = questionSchema.safeParse(q)
    return {
      index: i,
      valid: parsed.success,
      errors: parsed.success ? [] : parsed.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`),
      question: q,
    }
  })

  return apiSuccess({ preview })
})
