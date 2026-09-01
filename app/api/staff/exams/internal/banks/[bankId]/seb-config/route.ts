import { NextRequest } from 'next/server'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { isInternalExamSystemEnabled } from '@/lib/internal-exam/engine'
import { AuditAction, createAuditLog } from '@/lib/audit/logger'
import { z } from 'zod'

const sebConfigSchema = z.object({
  lockdownLevel: z.enum(['standard', 'strict', 'maximum']).optional(),
  allowedApplications: z.array(z.string()).optional(),
  blockedApplications: z.array(z.string()).optional(),
  enablePrintScreen: z.boolean().optional(),
  enableClipboard: z.boolean().optional(),
  enableExitSequencer: z.boolean().optional(),
  allowQuit: z.boolean().optional(),
  showTaskbar: z.boolean().optional(),
  enableDeveloperTools: z.boolean().optional(),
})

// GET /api/staff/exams/internal/banks/[bankId]/seb-config
export const GET = withErrorHandler(async (req: NextRequest, ctx: { params: Promise<{ bankId: string }> }) => {
  await requireStaff()
  if (!(await isInternalExamSystemEnabled())) {
    return apiError('Internal exams are not currently available', 403)
  }
  const { bankId } = await ctx.params

  const bank = await prismaUnfiltered.internalExamBank.findUnique({
    where: { id: bankId },
    select: { sebConfig: true },
  })

  if (!bank) {
    return apiError('Bank not found', 404)
  }

  return apiSuccess(bank.sebConfig || {})
})

// PUT /api/staff/exams/internal/banks/[bankId]/seb-config
export const PUT = withErrorHandler(async (req: NextRequest, ctx: { params: Promise<{ bankId: string }> }) => {
  const staff = await requireStaff()
  if (!(await isInternalExamSystemEnabled())) {
    return apiError('Internal exams are not currently available', 403)
  }
  const { bankId } = await ctx.params
  const body = await req.json()
  const parsed = sebConfigSchema.safeParse(body)
  if (!parsed.success) {
    return apiError(parsed.error.issues.map(i => i.message).join('; '), 400)
  }

  const existing = await prismaUnfiltered.internalExamBank.findUnique({
    where: { id: bankId },
    select: { sebConfig: true },
  })
  if (!existing) {
    return apiError('Bank not found', 404)
  }

  const updated = await prismaUnfiltered.internalExamBank.update({
    where: { id: bankId },
    data: { sebConfig: parsed.data },
    select: { sebConfig: true },
  })

  await createAuditLog({
    userId: staff.id,
    action: AuditAction.SYSTEM_UPDATE,
    entity: 'InternalExamBank',
    entityId: bankId,
    description: `Updated SEB configuration for exam bank`,
    changes: { before: existing.sebConfig, after: parsed.data },
  })

  return apiSuccess(updated.sebConfig || {})
})
