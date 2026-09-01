import { NextRequest } from 'next/server'
import { withErrorHandler, apiSuccess } from '@/lib/api/response'
import { requireStaff } from '@/lib/auth/helpers'
import { getPageViews } from '@/lib/analytics/queries'

export const GET = withErrorHandler(async (req: NextRequest) => {
  await requireStaff()
  const url = new URL(req.url)
  const from = url.searchParams.get('from') ? new Date(url.searchParams.get('from')!) : undefined
  const to = url.searchParams.get('to') ? new Date(url.searchParams.get('to')!) : undefined
  const limit = parseInt(url.searchParams.get('limit') || '20', 10)

  const metrics = await getPageViews(from, to, limit)
  return apiSuccess({ pages: metrics })
})
