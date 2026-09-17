import { NextRequest } from 'next/server'
import { withErrorHandler, apiSuccess, apiError } from '@/lib/api/response'
import { requireStaff } from '@/lib/auth/helpers'
import { getPageViews } from '@/lib/analytics/queries'

export const GET = withErrorHandler(async (req: NextRequest) => {
  await requireStaff()
  const url = new URL(req.url)
  const fromRaw = url.searchParams.get('from')
  const toRaw = url.searchParams.get('to')
  const limitRaw = url.searchParams.get('limit') || '20'

  const from = fromRaw ? new Date(fromRaw) : undefined
  const to = toRaw ? new Date(toRaw) : undefined
  const limit = parseInt(limitRaw, 10)

  if (from && Number.isNaN(from.getTime())) {
    return apiError('Invalid "from" date format', 400)
  }
  if (to && Number.isNaN(to.getTime())) {
    return apiError('Invalid "to" date format', 400)
  }
  if (Number.isNaN(limit) || limit <= 0 || limit > 100) {
    return apiError('Invalid "limit" parameter', 400)
  }

  const metrics = await getPageViews(from, to, limit)
  return apiSuccess({ pages: metrics })
})
