import { NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth/helpers'
import {
  getEasaComplianceReport,
  generateEasaComplianceCSV,
} from '@/lib/compliance/reports'
import { logAuditEvent } from '@/lib/audit/logger'

export async function GET() {
  try {
    const session = await getAuthSession()
    if (!session || (session.user.role !== 'STAFF' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const report = await getEasaComplianceReport()
    const csv = generateEasaComplianceCSV(report)

    await logAuditEvent({
      userId: session.user.id,
      action: 'REPORT_DOWNLOAD',
      entity: 'EasaComplianceReport',
      entityId: session.user.id,
      description: `Staff exported EASA compliance report (${report.totalAttempts} attempts, ${report.overallPassRate}% pass rate)`,
    })

    const response = new NextResponse(csv)
    response.headers.set('Content-Type', 'text/csv')
    response.headers.set(
      'Content-Disposition',
      `attachment; filename=easa-compliance-${new Date().toISOString().split('T')[0]}.csv`
    )
    return response
  } catch {
    return NextResponse.json({ error: 'Failed to generate EASA compliance report' }, { status: 500 })
  }
}
