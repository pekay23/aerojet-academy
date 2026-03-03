import { NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth/helpers'
import { generatePoolRosterCSV } from '@/lib/compliance/reports'
import { logAuditEvent } from '@/lib/audit/logger'

export async function GET(req: Request, { params }: { params: Promise<{ poolId: string }> }) {
  try {
    const { poolId } = await params

    const session = await getAuthSession()
    if (!session || (session.user.role !== 'STAFF' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!poolId) {
      return NextResponse.json({ error: 'Missing poolId' }, { status: 400 })
    }

    const csvContent = await generatePoolRosterCSV(poolId)

    // Log the audit event
    await logAuditEvent({
      userId: session.user.id,
      action: 'REPORT_DOWNLOAD',
      entity: 'ExamPool',
      entityId: poolId,
      description: `Staff downloaded exam roster for pool ${poolId}`,
    })

    // Return the CSV as a downloadable file
    const response = new NextResponse(csvContent)
    response.headers.set('Content-Type', 'text/csv')
    response.headers.set(
      'Content-Disposition',
      `attachment; filename=roster-${poolId}-${new Date().toISOString().split('T')[0]}.csv`
    )

    return response
  } catch (error: any) {
    console.error('[ROSTER_REPORT_ERROR]', error)
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 })
  }
}
