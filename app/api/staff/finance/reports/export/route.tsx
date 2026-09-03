import { NextRequest, NextResponse } from 'next/server'
import { requireStaff } from '@/lib/auth/helpers'
import {
  getFinanceReportSummary,
  getRevenueByProgrammeType,
  getMonthlyRevenueData,
  getPaymentStatusBreakdown,
} from '@/lib/analytics/reports'
import { renderToStream } from '@react-pdf/renderer'
import { FinancialReportTemplate } from '@/components/pdf/templates/FinancialReportTemplate'
import { getPDFSettings } from '@/lib/pdf-settings'
import React from 'react'

function FinancialReportElement(props: any) {
  return <FinancialReportTemplate {...props} />
}

/**
 * GET /api/staff/finance/reports/export
 *
 * Generates a PDF financial report.
 * Query params: ?year=2024&month=6
 */
export async function GET(req: NextRequest) {
  try {
    await requireStaff()

    const { searchParams } = new URL(req.url)
    const yearParam = searchParams.get('year')
    const monthParam = searchParams.get('month')

    const year = yearParam ? parseInt(yearParam) : new Date().getFullYear()
    // Default to 1 (January) if no month is provided and we need a month for the template.
    // In a real app, you might adjust the template to handle yearly reports without a specific month.
    const month = monthParam ? parseInt(monthParam) : new Date().getMonth() + 1

    const [summary, revenueByType, monthlyData, paymentStatus] = await Promise.all([
      getFinanceReportSummary({ year, month }),
      getRevenueByProgrammeType({ year, month }),
      getMonthlyRevenueData({ year }),
      getPaymentStatusBreakdown({ year, month }),
    ])

    // Get PDF branding settings
    const pdfSettings = await getPDFSettings(req.nextUrl.origin)

    const stream = await renderToStream(
      FinancialReportElement({
        year,
        month,
        summary: {
          totalRevenue: summary.totalRevenue,
          revenueThisMonth: summary.revenueThisMonth,
          pendingAmount: summary.pendingAmount,
          avgTransactionValue: summary.avgTransactionValue,
        },
        monthlyData: monthlyData,
        revenueByType: revenueByType,
        paymentStatus: paymentStatus,
        logoUrl: pdfSettings.logoUrl,
        watermarkUrl: pdfSettings.watermarkUrl,
        watermarkOpacity: pdfSettings.watermarkOpacity,
      })
    )

    return new NextResponse(stream as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="financial-report-${year}-${month}.pdf"`,
      },
    })
  } catch (error) {
    console.error('[FINANCE_REPORT_EXPORT]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
