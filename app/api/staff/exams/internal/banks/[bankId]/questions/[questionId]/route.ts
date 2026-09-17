import { NextRequest } from 'next/server'
import { getAuthSession } from '@/lib/auth/helpers'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { Prisma } from '@prisma/client'
import { isInternalExamSystemEnabled } from '@/lib/internal-exam/engine'
import { AuditAction, createAuditLog } from '@/lib/audit/logger'
import { z } from 'zod'

const questionSchema = z
  .object({
    text: z.string().min(1),
    options: z.array(z.string()).min(3).max(3),
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

export const GET = withErrorHandler(
  async (req: NextRequest, ctx: { params: Promise<{ bankId: string; questionId: string }> }) => {
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
    const { questionId } = await ctx.params

    const versions = await prismaUnfiltered.internalExamQuestionVersion.findMany({
      where: { questionId },
      orderBy: { changedAt: 'desc' },
    })

    return apiSuccess(versions)
  }
)

export const PUT = withErrorHandler(
  async (req: NextRequest, ctx: { params: Promise<{ bankId: string; questionId: string }> }) => {
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
    const { questionId } = await ctx.params
    const body = await req.json()
    const parsed = questionSchema.safeParse(body)
    if (!parsed.success) {
      return apiError(
        parsed.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join('; '),
        400
      )
    }

    const existing = await prismaUnfiltered.internalExamQuestion.findUnique({
      where: { id: questionId },
    })
    if (!existing) {
      return apiError('Question not found', 404)
    }

    const changedFields: string[] = []
    if (existing.text !== parsed.data.text) changedFields.push('text')
    if (JSON.stringify(existing.options) !== JSON.stringify(parsed.data.options))
      changedFields.push('options')
    if (existing.correctAnswer !== parsed.data.correctAnswer) changedFields.push('correctAnswer')
    if (existing.subTopic !== parsed.data.subTopic) changedFields.push('subTopic')
    if (existing.difficulty !== parsed.data.difficulty) changedFields.push('difficulty')
    if (existing.points !== parsed.data.points) changedFields.push('points')
    if (existing.syllabusRef !== parsed.data.syllabusRef) changedFields.push('syllabusRef')
    if (existing.knowledgeLevel !== parsed.data.knowledgeLevel) changedFields.push('knowledgeLevel')
    if (existing.explanation !== parsed.data.explanation) changedFields.push('explanation')

    if (changedFields.length === 0) {
      return apiSuccess({ ...existing, versions: [] })
    }

    const nextVersion =
      (await prismaUnfiltered.internalExamQuestionVersion.count({
        where: { questionId },
      })) + 1

    await prismaUnfiltered.internalExamQuestionVersion.create({
      data: {
        questionId,
        version: nextVersion,
        text: existing.text,
        options: existing.options as unknown as Prisma.InputJsonValue,
        correctAnswer: existing.correctAnswer,
        points: existing.points,
        difficulty: existing.difficulty,
        isActive: existing.isActive,
        explanation: existing.explanation,
        changeType: 'EDITED',
        changedById: session.user.id,
        changeReason: `Modified: ${changedFields.join(', ')}`,
      },
    })

    const updated = await prismaUnfiltered.internalExamQuestion.update({
      where: { id: questionId },
      data: {
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

    await createAuditLog({
      userId: session.user.id,
      action: AuditAction.UPDATE,
      entity: 'InternalExamQuestion',
      entityId: questionId,
      description: `Question ${questionId} edited. Changed: ${changedFields.join(', ')}.`,
      changes: {
        questionId,
        bankId: existing.bankId,
        changedFields,
        previous: {
          text: existing.text,
          options: existing.options as unknown as Prisma.InputJsonValue,
          correctAnswer: existing.correctAnswer,
          points: existing.points,
          difficulty: existing.difficulty,
        },
        next: {
          text: parsed.data.text,
          options: parsed.data.options,
          correctAnswer: parsed.data.correctAnswer,
          points: parsed.data.points,
          difficulty: parsed.data.difficulty,
        },
        version: nextVersion,
      },
    })

    return apiSuccess(updated)
  }
)

export const DELETE = withErrorHandler(
  async (req: NextRequest, ctx: { params: Promise<{ bankId: string; questionId: string }> }) => {
    const session = await getAuthSession()
    if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return apiError('Unauthorized', 403)
    }

    const { questionId } = await ctx.params
    const existing = await prismaUnfiltered.internalExamQuestion.findUnique({
      where: { id: questionId },
    })
    if (!existing) {
      return apiError('Question not found', 404)
    }

    const nextVersion =
      (await prismaUnfiltered.internalExamQuestionVersion.count({
        where: { questionId },
      })) + 1

    await prismaUnfiltered.internalExamQuestionVersion.create({
      data: {
        questionId,
        version: nextVersion,
        text: existing.text,
        options: existing.options as unknown as Prisma.InputJsonValue,
        correctAnswer: existing.correctAnswer,
        points: existing.points,
        difficulty: existing.difficulty,
        isActive: existing.isActive,
        explanation: existing.explanation,
        changeType: 'RETIRED',
        changedById: session.user.id,
        changeReason: 'Question retired by admin',
      },
    })

    await prismaUnfiltered.internalExamQuestion.update({
      where: { id: questionId },
      data: { isActive: false },
    })

    await createAuditLog({
      userId: session.user.id,
      action: AuditAction.UPDATE,
      entity: 'InternalExamQuestion',
      entityId: questionId,
      description: `Question ${questionId} retired.`,
      changes: { questionId, bankId: existing.bankId, changeType: 'RETIRED' },
    })

    return apiSuccess({ success: true })
  }
)
