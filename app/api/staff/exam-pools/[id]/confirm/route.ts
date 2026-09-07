import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/auth/helpers'
import { apiSuccess, apiError, withErrorHandler , RouteContext } from '@/lib/api/response'
import { confirmPool } from '@/lib/pools/operations'

export const POST = withErrorHandler(async (req: NextRequest, ctx?: RouteContext) => {
  const admin = await requireAdmin()
  const id = (await ctx!.params).id
  if (!id) return apiError('Pool ID required')
  const pool = await confirmPool(id, admin.id)
  return apiSuccess({ message: 'Pool manually confirmed', pool })
})
