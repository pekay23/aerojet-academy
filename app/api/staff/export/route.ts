import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prismaUnfiltered } from '@/lib/prisma/client'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF')) {
      return new NextResponse('Unauthorized', { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')

    let data: any[] = []
    let filename = 'export.csv'

    if (type === 'students') {
      const users = await prismaUnfiltered.user.findMany({
        where: { role: 'STUDENT' },
        include: { profile: true, studentProfile: true },
      })
      
      data = users.map(u => ({
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
      
      data = pools.map(p => ({
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
         include: { wallet: { include: { user: { include: { profile: true } } } } },
         orderBy: { createdAt: 'desc' }
       })

       data = txs.map(t => ({
         ID: t.id,
         Date: t.createdAt.toISOString(),
         Student: `${t.wallet.user.profile?.firstName || ''} ${t.wallet.user.profile?.lastName || ''}`.trim(),
         Type: t.type,
         Reference: t.referenceType,
         Amount: t.amount,
         Description: t.description,
       }))
       filename = 'financial_transactions.csv'

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
      ...data.map(row => 
        headers.map(header => {
          let val = row[header]
          if (val === null || val === undefined) val = ''
          // Escape quotes and wrap in quotes if contains comma
          val = String(val).replace(/"/g, '""')
          if (val.includes(',') || val.includes('"') || val.includes('\n')) {
            val = `"${val}"`
          }
          return val
        }).join(',')
      )
    ].join('\n')

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error: any) {
    console.error('[CSV_EXPORT]', error)
    return NextResponse.json(
      { error: error.message || 'Failed to export data' },
      { status: 500 }
    )
  }
}
