import { NextResponse } from 'next/server'
import { getPageViews } from '@/lib/analytics/queries'

export const GET = withErrorHandler(async (req) => {
  const url = new URL(req.url)
  const from = url.searchParams.get('from') ? new Date(url.searchParams.get('from')!) : undefined
  const to = url.searchParams.get('to') ? new Date(url.searchParams.get('to')!) : undefined
  const limit = parseInt(url.searchParams.get('limit') || '20', 10)

  const metrics = await getPageViews(from, to, limit)
  return apiSuccess({ pages: metrics })
})
