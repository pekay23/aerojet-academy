import { NextRequest } from 'next/server'
import { requireInstructor } from '@/lib/auth/helpers'
import { apiSuccess, apiError, apiForbidden, withErrorHandler } from '@/lib/api/response'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { isInternalExamSystemEnabled, getBankRules } from '@/lib/internal-exam/engine'
import { AuditAction, createAuditLog } from '@/lib/audit/logger'
import { getInstructorProfileByUserId } from '@/lib/instructor/profile'
import { z } from 'zod'

const overrideSchema = z.object({
  passMarkPct: z.number().min(0).max(100).optional(),
  timePerQuestionSecs: z.number().min(10).max(600).optional(),
  retakeWaitDays: z.number().min(0).max(365).optional(),
  maxRetakes: z.number().min(0).max(10).optional(),
  completionWindowYears: z.number().min(1).max(20).optional(),
  allowKeyboardAutoSubmit: z.boolean().optional(),
  customInstructions: z.string().max(2000).optional(),
  mcqCount: z.number().min(5).max(200).optional(),
})

/**
 * GET /api/instructor/exams/banks/[bankId]/rule-override
 * Returns the current rule override for the bank (instructor must have canEdit).
 */
export const GET = withErrorHandler(
  async (req: NextRequest, ctx: { params: Promise<{ bankId: string }> }) => {
    const user = await requireInstructor()
    const instructorProfile = await getInstructorProfileByUserId(user.id)
    if (!instructorProfile) return apiForbidden('Instructor profile not found')

    if (!(await isInternalExamSystemEnabled())) {
      return apiError('Internal exams are not currently available', 403)
    }

    const { bankId } = await ctx.params

    const grant = await prismaUnfiltered.internalExamBankInstructor.findFirst({
      where: { bankId, instructorId: instructorProfile.id },
      select: { canEdit: true },
    })
    if (!grant) return apiForbidden('You do not have access to this bank')

    const override = await prismaUnfiltered.internalExamRuleOverride.findUnique({
      where: { bankId },
    })
    const bank = await prismaUnfiltered.internalExamBank.findUnique({
      where: { id: bankId },
      select: { mcqCount: true },
    })

    return apiSuccess({
      ...override,
      mcqCount: bank?.mcqCount ?? 40,
    })
  }
)

/**
 * PUT /api/instructor/exams/banks/[bankId]/rule-override
 * Updates the rule override for the bank (instructor must have canEdit).
 */
export const PUT = withErrorHandler(
  async (req: NextRequest, ctx: { params: Promise<{ bankId: string }> }) => {
    const user = await requireInstructor()
    const instructorProfile = await getInstructorProfileByUserId(user.id)
    if (!instructorProfile) return apiForbidden('Instructor profile not found')

    if (!(await isInternalExamSystemEnabled())) {
      return apiError('Internal exams are not currently available', 403)
    }

    const { bankId } = await ctx.params

    const grant = await prismaUnfiltered.internalExamBankInstructor.findFirst({
      where: { bankId, instructorId: instructorProfile.id },
      select: { canEdit: true },
    })
    if (!grant?.canEdit) return apiForbidden('You do not have permission to edit this bank')

    const body = await req.json()
    const parsed = overrideSchema.safeParse(body)
    if (!parsed.success) {
      return apiError(`Invalid request: ${parsed.error.message}`, 400)
    }

    const { mcqCount, ...ruleData } = parsed.data

    // Update rule override
    const override = await prismaUnfiltered.internalExamRuleOverride.upsert({
      where: { bankId },
      update: ruleData,
      create: { bankId, ...ruleData },
    })

    // Update bank mcqCount if provided
    if (mcqCount) {
      await prismaUnfiltered.internalExamBank.update({
        where: { id: bankId },
        data: { mcqCount },
      })
    }

    await createAuditLog({
      userId: user.id,
      action: AuditAction.UPDATE,
      entity: 'InternalExamRuleOverride',
      entityId: bankId,
      description: `Updated exam rules for bank ${bankId}`,
      changes: { ...ruleData, ...(mcqCount ? { mcqCount } : {}) },
    })

    return apiSuccess(override)
  }
)
