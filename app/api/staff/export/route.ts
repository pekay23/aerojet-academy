import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prismaUnfiltered } from '@/lib/prisma/client'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !['ADMIN', 'SUPER_ADMIN', 'STAFF'].includes(session.user.role)) {
      return new NextResponse('Unauthorized', { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    // Optional date-range filter (SEC-23). Bounded export prevents accidental
    // multi-million row dumps + matches the financial reporting period the
    // staff member is actually looking at.
    const fromParam = searchParams.get('from')
    const toParam = searchParams.get('to')
    const limitParam = searchParams.get('limit')
    const dateFilter: { gte?: Date; lte?: Date } = {}
    if (fromParam) {
      const d = new Date(fromParam)
      if (!Number.isNaN(d.getTime())) dateFilter.gte = d
    }
    if (toParam) {
      const d = new Date(toParam)
      if (!Number.isNaN(d.getTime())) dateFilter.lte = d
    }
    const takeCap = Math.min(
      Math.max(parseInt(limitParam || '10000', 10) || 10000, 1),
      50_000
    )

    let data: Record<string, string | number | boolean>[] = []
    let filename = 'export.csv'

    if (type === 'students') {
      const users = await prismaUnfiltered.user.findMany({
        where: { role: 'STUDENT' },
        include: { profile: true, studentProfile: true },
      })

      data = users.map((u) => ({
        ID: u.id,
        Name: `${u.profile?.firstName || ''} ${u.profile?.lastName || ''}`.trim(),
        Email: u.email,
        AcademyEmail: u.academyEmail || '',
        StudentId: u.studentProfile?.studentId || '',
        EnrollmentType: u.studentProfile?.enrollmentType || '',
        Pathway: u.programmeChoice || '',
        JoinedAt: u.createdAt.toISOString(),
      }))
      filename = 'students_export.csv'
    } else if (type === 'pools') {
      const pools = await prismaUnfiltered.examPool.findMany({
        include: { event: true },
      })

      data = pools.map((p) => ({
        ID: p.id,
        Name: p.name,
        Event: p.event?.name || '',
        Date: p.examDate ? p.examDate.toISOString().split('T')[0] : '',
        Status: p.status,
        CurrentCandidates: p.currentMemberCount,
        MaxCandidates: p.maxCandidates,
        Modules: p.allowedModules.join(', '),
      }))
      filename = 'exam_pools_export.csv'
    } else if (type === 'finances') {
      const txs = await prismaUnfiltered.walletTransaction.findMany({
        where: Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : undefined,
        include: { wallet: { include: { user: { include: { profile: true } } } } },
        orderBy: { createdAt: 'desc' },
        take: takeCap,
      })

      data = txs.map((t) => ({
        ID: t.id,
        Date: t.createdAt.toISOString(),
        Student:
          `${t.wallet.user.profile?.firstName || ''} ${t.wallet.user.profile?.lastName || ''}`.trim(),
        Type: String(t.type),
        Reference: t.referenceType ?? '',
        Amount: t.amount.toNumber(),
        Description: t.description ?? '',
      }))
      filename = 'financial_transactions.csv'
    } else if (type === 'audit-logs') {
      const logs = await prismaUnfiltered.auditLog.findMany({
        where: Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : undefined,
        include: { user: { include: { profile: true } } },
        orderBy: { createdAt: 'desc' },
        take: Math.min(takeCap, 5000),
      })

      data = logs.map((l) => ({
        Date: l.createdAt.toISOString(),
        Action: l.action,
        Entity: l.entity || '',
        EntityId: l.entityId || '',
        User: l.user?.profile
          ? `${l.user.profile.firstName || ''} ${l.user.profile.lastName || ''}`.trim()
          : l.user?.email || 'System',
        Description: l.description || '',
        IP: l.ipAddress || '',
      }))
      filename = 'audit_logs_export.csv'
    } else {
      return NextResponse.json({ error: 'Invalid export type' }, { status: 400 })
    }

    if (data.length === 0) {
      return NextResponse.json({ error: 'No data to export' }, { status: 404 })
    }

    // Convert to CSV
    const headers = Object.keys(data[0])
    const csvContent = [
      headers.join(','),
      ...data.map((row) =>
        headers
          .map((header) => {
            let val = row[header]
            if (val === null || val === undefined) val = ''
            // Escape quotes and wrap in quotes if contains comma
            val = String(val).replace(/"/g, '""')
            if (val.includes(',') || val.includes('"') || val.includes('\n')) {
              val = `"${val}"`
            }
            return val
          })
          .join(',')
      ),
    ].join('\n')

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error: unknown) {
    console.error('[CSV_EXPORT]', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to export data' }, { status: 500 })
  }
}
