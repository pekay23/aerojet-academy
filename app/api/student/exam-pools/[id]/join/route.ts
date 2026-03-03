import { NextRequest } from 'next/server'
import { requireStudent } from '@/lib/auth/helpers'
import { apiCreated, apiError, withErrorHandler } from '@/lib/api/response'
import { joinPoolSchema, validateBody } from '@/lib/validation/schemas'
import { joinPool } from '@/lib/pools/operations'
import { createAuditLog } from '@/lib/audit/logger'
import prisma from '@/lib/prisma/client'

export const POST = withErrorHandler(
  async (req: NextRequest, ctx?: { params: Record<string, string> }) => {
    const user = await requireStudent()
    const poolId = ctx?.params?.id
    if (!poolId) return apiError('Pool ID required')

    const body = await req.json()
    const validation = validateBody(joinPoolSchema, body)
    if (!validation.success) return apiError((validation as any).error)

    // Find the exam component for the selected module
    const examComponent = await prisma.examComponent.findFirst({
      where: { course: { code: validation.data.selectedModule } },
    })

    const result = await joinPool({
      poolId,
      userId: user.id,
      examComponentId: examComponent?.id,
    })

    if (!result.success) {
      return apiError(result.error || 'Failed to join pool')
    }

    await createAuditLog({
      action: 'POOL_JOIN',
      entity: 'PoolMembership',
      entityId: result.membership?.id || poolId,
      userId: user.id,
      details: { poolId, module: validation.data.selectedModule },
    })

    const { getCurrencySymbol } = await import('@/lib/currency')
    const settings = await prisma.systemSetting.findMany({
      where: { key: 'course_currency' },
    })
    const currency = settings[0]?.value || 'EUR'
    const symbol = getCurrencySymbol(currency)

    return apiCreated({
      message: `Successfully joined pool! ${symbol}300 has been held in your wallet.`,
      membershipId: result.membership?.id,
      autoConfirmed: result.autoConfirmed,
    })
  }
)
