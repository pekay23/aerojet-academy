import { NextRequest, NextResponse } from 'next/server'
import { requireStaff } from '@/lib/auth/helpers'
import {
  getFinanceReportSummary,
  getRevenueByProgrammeType,
  getPaymentMethodBreakdown,
  getMonthlyRevenueData,
  getPaymentStatusBreakdown,
} from '@/lib/analytics/reports'

/**
 * GET /api/staff/finance/reports
 *
 * Returns finance report data with optional year/month filtering.
 * Query params: ?year=2024&month=6
 */
export async function GET(req: NextRequest) {
  try {
    await requireStaff()

    const { searchParams } = new URL(req.url)
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined
    const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : undefined

    const [summary, revenueByType, paymentMethods, monthlyData, paymentStatus] = await Promise.all([
      getFinanceReportSummary({ year, month }),
      getRevenueByProgrammeType({ year, month }),
      getPaymentMethodBreakdown(),
      getMonthlyRevenueData({ year }),
      getPaymentStatusBreakdown({ year, month }),
    ])

    return NextResponse.json({
      summary,
      revenueByType,
      paymentMethods,
      monthlyData,
      paymentStatus,
    })
  } catch (error) {
    console.error('[FINANCE_REPORTS_API]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
