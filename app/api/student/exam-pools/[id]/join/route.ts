import { NextRequest } from 'next/server'
import { requireStudent } from '@/lib/auth/helpers'
import { apiCreated, apiError, withErrorHandler } from '@/lib/api/response'
import { joinPoolSchema, validateBody } from '@/lib/validation/schemas'
import { joinPool } from '@/lib/pools/operations'
import { createAuditLog } from '@/lib/audit/logger'
import prisma from '@/lib/prisma/client'
import { getSystemSetting } from '@/lib/settings'

export const POST = withErrorHandler(
  async (req: NextRequest, ctx?: { params: Record<string, string> }) => {
    const user = await requireStudent()
    const poolId = ctx?.params?.id
    if (!poolId) return apiError('Pool ID required')

    const body = await req.json()
    const validation = validateBody(joinPoolSchema, body)
    if (!validation.success) return apiError(validation.error)

    // Find the exam component for the selected module
    const examComponent = await prisma.examComponent.findFirst({
      where: { code: validation.data.selectedModule },
    })

    if (!examComponent) {
      return apiError(`Module ${validation.data.selectedModule} not found`)
    }

    const result = await joinPool({
      poolId,
      userId: user.id,
      examComponentId: examComponent.id,
      moduleCode: validation.data.selectedModule,
    })

    if (!result.success) {
      return apiError(result.error || 'Failed to join booking')
    }

    await createAuditLog({
      action: 'POOL_JOIN',
      entity: 'PoolMembership',
      entityId: result.membership?.id || poolId,
      userId: user.id,
      details: { poolId, module: validation.data.selectedModule },
    })

    const { getCurrencySymbol } = await import('@/lib/currency')
    const currency = await getSystemSetting('course_currency', 'EUR')
    const symbol = getCurrencySymbol(currency)

    return apiCreated({
      message: `Successfully joined booking! ${symbol}300 has been held in your wallet.`,
      membershipId: result.membership?.id,
      autoConfirmed: result.autoConfirmed,
    })
  }
)
