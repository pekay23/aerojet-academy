import { NextRequest } from 'next/server'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { isInternalExamSystemEnabled } from '@/lib/internal-exam/engine'
import { AuditAction, createAuditLog } from '@/lib/audit/logger'
import { z } from 'zod'

const ruleOverrideSchema = z.object({
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
 * GET /api/staff/exams/internal/banks/[bankId]/rule-override
 * Returns the current rule override for the bank.
 */
export const GET = withErrorHandler(async (req: NextRequest, ctx: { params: Promise<{ bankId: string }> }) => {
  await requireStaff()
  if (!(await isInternalExamSystemEnabled())) {
    return apiError('Internal exams are not currently available', 403)
  }

  const { bankId } = await ctx.params

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
})

/**
 * PUT /api/staff/exams/internal/banks/[bankId]/rule-override
 * Updates the rule override for the bank.
 */
export const PUT = withErrorHandler(async (req: NextRequest, ctx: { params: Promise<{ bankId: string }> }) => {
  await requireStaff()
  if (!(await isInternalExamSystemEnabled())) {
    return apiError('Internal exams are not currently available', 403)
  }

  const { bankId } = await ctx.params

  const body = await req.json()
  const parsed = ruleOverrideSchema.safeParse(body)
  if (!parsed.success) {
    return apiError(`Invalid request: ${parsed.error.message}`, 400)
  }

  const { mcqCount, ...ruleData } = parsed.data

  const override = await prismaUnfiltered.internalExamRuleOverride.upsert({
    where: { bankId },
    update: ruleData,
    create: { bankId, ...ruleData },
  })

  if (mcqCount) {
    await prismaUnfiltered.internalExamBank.update({
      where: { id: bankId },
      data: { mcqCount },
    })
  }

  await createAuditLog({
    action: AuditAction.UPDATE,
    entity: 'InternalExamRuleOverride',
    entityId: bankId,
    description: `Staff updated exam rules for bank ${bankId}`,
    changes: { ...ruleData, ...(mcqCount ? { mcqCount } : {}) },
  })

  return apiSuccess(override)
})
