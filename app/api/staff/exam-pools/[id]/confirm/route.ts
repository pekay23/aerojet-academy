import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/auth/helpers'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { confirmPool } from '@/lib/pools/operations'

export const POST = withErrorHandler(async (req: NextRequest, ctx?: { params: Record<string, string> }) => {
  const admin = await requireAdmin()
  const id = ctx?.params?.id
  if (!id) return apiError('Pool ID required')
  const pool = await confirmPool(id, admin.id)
  return apiSuccess({ message: 'Pool manually confirmed', pool })
})
