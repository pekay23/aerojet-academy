import { NextRequest } from 'next/server'
import { requireInstructor } from '@/lib/auth/helpers'
import { apiSuccess, apiError, apiForbidden, withErrorHandler , RouteContext } from '@/lib/api/response'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { Prisma } from '@prisma/client'
import { isInternalExamSystemEnabled } from '@/lib/internal-exam/engine'
import { AuditAction, createAuditLog } from '@/lib/audit/logger'
import { getInstructorProfileByUserId } from '@/lib/instructor/profile'
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
  async (req: NextRequest, ctx?: RouteContext) => {
    const user = await requireInstructor()
    const instructorProfile = await getInstructorProfileByUserId(user.id)
    if (!instructorProfile) return apiForbidden('Instructor profile not found')

    if (!(await isInternalExamSystemEnabled())) {
      return apiError('Internal exams are not currently available', 403)
    }
    const { questionId } = (await ctx!.params) as { bankId: string; questionId: string }

    const versions = await prismaUnfiltered.internalExamQuestionVersion.findMany({
      where: { questionId },
      orderBy: { changedAt: 'desc' },
    })

    return apiSuccess(versions)
  }
)

export const PUT = withErrorHandler(
  async (req: NextRequest, ctx?: RouteContext) => {
    const user = await requireInstructor()
    const instructorProfile = await getInstructorProfileByUserId(user.id)
    if (!instructorProfile) return apiForbidden('Instructor profile not found')

    if (!(await isInternalExamSystemEnabled())) {
      return apiError('Internal exams are not currently available', 403)
    }
    const { bankId, questionId } = (await ctx!.params) as { bankId: string; questionId: string }

    const grant = await prismaUnfiltered.internalExamBankInstructor.findFirst({
      where: { bankId, instructorId: instructorProfile.id },
      select: { canEdit: true },
    })

    const existing = await prismaUnfiltered.internalExamQuestion.findUnique({
      where: { id: questionId },
      select: {
        id: true,
        bankId: true,
        submittedById: true,
        text: true,
        options: true,
        correctAnswer: true,
        subTopic: true,
        difficulty: true,
        points: true,
        syllabusRef: true,
        knowledgeLevel: true,
        explanation: true,
        isActive: true,
      },
    })
    if (!existing) return apiError('Question not found', 404)
    if (existing.bankId !== bankId) return apiError('Question does not belong to this bank', 400)
    if (!grant?.canEdit && existing.submittedById !== user.id) {
      return apiForbidden('You do not have permission to edit this question')
    }

    const body = await req.json()
    const parsed = questionSchema.safeParse(body)
    if (!parsed.success) {
      return apiError(
        parsed.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join('; '),
        400
      )
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
        changedById: user.id,
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
        submittedById: user.id,
      },
    })

    await createAuditLog({
      userId: user.id,
      action: AuditAction.EXAM_QUESTION_UPDATED,
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
  async (req: NextRequest, ctx?: RouteContext) => {
    const user = await requireInstructor()
    const instructorProfile = await getInstructorProfileByUserId(user.id)
    if (!instructorProfile) return apiForbidden('Instructor profile not found')

    if (!(await isInternalExamSystemEnabled())) {
      return apiError('Internal exams are not currently available', 403)
    }
    const { bankId, questionId } = (await ctx!.params) as { bankId: string; questionId: string }

    const grant = await prismaUnfiltered.internalExamBankInstructor.findFirst({
      where: { bankId, instructorId: instructorProfile.id },
      select: { canEdit: true },
    })

    const existing = await prismaUnfiltered.internalExamQuestion.findUnique({
      where: { id: questionId },
      select: {
        id: true,
        bankId: true,
        submittedById: true,
        text: true,
        options: true,
        correctAnswer: true,
        points: true,
        difficulty: true,
        isActive: true,
        explanation: true,
      },
    })
    if (!existing) return apiError('Question not found', 404)
    if (existing.bankId !== bankId) return apiError('Question does not belong to this bank', 400)
    if (!grant?.canEdit && existing.submittedById !== user.id) {
      return apiForbidden('You do not have permission to retire this question')
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
        changedById: user.id,
        changeReason: 'Question retired by instructor',
      },
    })

    await prismaUnfiltered.internalExamQuestion.update({
      where: { id: questionId },
      data: { isActive: false },
    })

    await createAuditLog({
      userId: user.id,
      action: AuditAction.EXAM_QUESTION_RETIRED,
      entity: 'InternalExamQuestion',
      entityId: questionId,
      description: `Question ${questionId} retired.`,
      changes: { questionId, bankId: existing.bankId, changeType: 'RETIRED' },
    })

    return apiSuccess({ success: true })
  }
)
