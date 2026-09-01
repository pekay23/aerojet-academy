import { NextRequest } from 'next/server'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiNotFound, withErrorHandler } from '@/lib/api/response'
import { prismaUnfiltered } from '@/lib/prisma/client'

/**
 * POST /api/staff/exams/internal/banks/[bankId]/retire
 * Retire an exam bank — it will no longer be available for new exams
 * but existing sessions are preserved for regulatory compliance.
 */
export const POST = withErrorHandler(async (
  _req: NextRequest,
  ctx: { params: Promise<{ bankId: string }> }
) => {
  await requireStaff()
  const { bankId } = await ctx.params

  const bank = await prismaUnfiltered.internalExamBank.findUnique({
    where: { id: bankId },
    select: { id: true, name: true, isActive: true },
  })

  if (!bank) return apiNotFound('Bank not found')

  const updated = await prismaUnfiltered.internalExamBank.update({
    where: { id: bankId },
    data: { isActive: false },
    select: { id: true, name: true, isActive: true },
  })

  return apiSuccess(updated)
})
