import 'server-only'

import { NextRequest } from 'next/server'
import { requireInstructor } from '@/lib/auth/helpers'
import { apiError, apiCreated, withErrorHandler } from '@/lib/api/response'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { createAuditLog, AuditAction } from '@/lib/audit/logger'
import { z } from 'zod'
import { isInternalExamSystemEnabled } from '@/lib/internal-exam/engine'
import { getInstructorProfileByUserId } from '@/lib/instructor/profile'
import { questionHash } from '@/lib/internal-exam/import/dedupe'

const questionSchema = z
  .object({
    text: z.string().min(1),
    options: z.array(z.string()).min(3).max(3),
    correctAnswer: z.string(),
    subTopic: z.string().optional(),
    difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).optional(),
    points: z.number().min(1).optional(),
    explanation: z.string().optional(),
  })
  .refine((data) => data.options.includes(data.correctAnswer), {
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
  const { questions, bankId } = body as {
    questions: z.infer<typeof questionSchema>[]
    bankId: string
  }

  if (!Array.isArray(questions) || questions.length === 0) {
    return apiError('No questions provided', 400)
  }

  const bank = await prismaUnfiltered.internalExamBank.findFirst({
    where: { id: bankId },
    include: { instructors: { where: { instructorId: user.id } } },
  })
  if (!bank) return apiError('Bank not found', 404)
  const grant = bank.instructors.find((a: { instructorId: string }) => a.instructorId === user.id)
  if (!grant?.canEdit)
    return apiError('You do not have permission to import questions into this bank', 403)

  const existingQuestions = await prismaUnfiltered.internalExamQuestion.findMany({
    where: { bankId },
    select: { text: true, options: true },
  })
  const existingHashes = new Set(
    existingQuestions.map((q) => {
      const opts = Array.isArray(q.options) ? (q.options as string[]) : []
      return questionHash(q.text, opts)
    })
  )

  const validQuestions = questions.filter((q) => {
    const parsed = questionSchema.safeParse(q)
    if (!parsed.success) return false
    return !existingHashes.has(questionHash(parsed.data.text, parsed.data.options))
  })

  const failed = questions.length - validQuestions.length

  if (validQuestions.length > 0) {
    await prismaUnfiltered.internalExamQuestion.createMany({
      data: validQuestions.map((q) => ({
        bankId,
        text: q.text,
        options: q.options,
        correctAnswer: q.correctAnswer,
        subTopic: q.subTopic || null,
        difficulty: q.difficulty || 'MEDIUM',
        points: q.points || 1,
        explanation: q.explanation || null,
        status: 'PENDING_APPROVAL',
        submittedById: user.id,
      })),
    })
  }

  await createAuditLog({
    userId: user.id,
    action: AuditAction.EXAM_QUESTION_IMPORT,
    entity: 'InternalExamBank',
    entityId: bankId,
    description: `Bulk imported ${validQuestions.length} questions`,
    changes: { totalReceived: questions.length, created: validQuestions.length, failed },
  })

  return apiCreated({ created: validQuestions.length, failed })
})
