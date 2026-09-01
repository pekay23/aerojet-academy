import { NextRequest } from 'next/server'
import { withErrorHandler, apiError, apiSuccess } from '@/lib/api/response'
import { requireStaff } from '@/lib/auth/helpers'
import { getFunnelMetrics } from '@/lib/analytics/queries'

export const GET = withErrorHandler(async (req: NextRequest, _ctx: any) => {
  await requireStaff()
  const url = new URL(req.url)
  const funnelRaw = url.searchParams.get('funnel')
  const isValidFunnel = (f: string | null): f is 'registration' | 'enrollment' | 'exam' | 'payment' =>
    f !== null && ['registration', 'enrollment', 'exam', 'payment'].includes(f)

  if (!isValidFunnel(funnelRaw)) {
    return apiError('Invalid funnel name. Use: registration, enrollment, exam, payment', 400)
  }

  const from = url.searchParams.get('from') ? new Date(url.searchParams.get('from')!) : undefined
  const to = url.searchParams.get('to') ? new Date(url.searchParams.get('to')!) : undefined

  const funnel = funnelRaw
  const metrics = await getFunnelMetrics(funnel, from, to)
  return apiSuccess(metrics)
})
