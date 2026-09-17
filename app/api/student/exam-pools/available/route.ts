import { NextRequest } from 'next/server'
import { requireStudent } from '@/lib/auth/helpers'
import { apiSuccess, withErrorHandler } from '@/lib/api/response'
import { getAvailablePools } from '@/lib/pools/operations'

export const GET = withErrorHandler(async (_req: NextRequest) => {
  await requireStudent()
  const pools = await getAvailablePools()
  return apiSuccess(pools)
})
