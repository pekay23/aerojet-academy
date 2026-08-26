import { NextResponse } from 'next/server'
import { getFunnelMetrics } from '@/lib/analytics/queries'

export const GET = withErrorHandler(async (req, ctx) => {
  const url = new URL(req.url)
  const funnel = url.searchParams.get('funnel') as 'registration' | 'enrollment' | 'exam' | 'payment' | null
  const from = url.searchParams.get('from') ? new Date(url.searchParams.get('from')!) : undefined
  const to = url.searchParams.get('to') ? new Date(url.searchParams.get('to')!) : undefined

  if (!funnel || !['registration', 'enrollment', 'exam', 'payment'].includes(funnel)) {
    return apiError('Invalid funnel name. Use: registration, enrollment, exam, payment', 400)
  }

  const metrics = await getFunnelMetrics(funnel, from, to)
  return apiSuccess(metrics)
})
