import { NextResponse } from 'next/server'
import { requireApplicant } from '@/lib/auth/helpers'
import { withdrawFromPool } from '@/lib/pools/withdraw'
import { apiError, withErrorHandler } from '@/lib/api/response'

export const POST = withErrorHandler(async (request: Request) => {
  const user = await requireApplicant()

  const { poolId } = await request.json()

  if (!poolId) {
    return apiError('Pool ID is required', 400)
  }

  const result = await withdrawFromPool(poolId, user.id)

  if (!result.success) {
    return apiError(result.error || 'Failed to withdraw from pool', 400)
  }

  return NextResponse.json({
    success: true,
    amountReleased: result.amountReleased,
    message: result.amountReleased
      ? `Successfully left pool. €${result.amountReleased} released back to your wallet.`
      : 'Successfully left pool.',
  })
})
