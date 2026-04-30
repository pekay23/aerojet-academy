import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma/client'
import { env } from '@/lib/env'

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // up to 5 minutes

export async function GET(req: NextRequest) {
  // Authenticate cron request
  const authHeader = req.headers.get('authorization')
  const cronSecret = env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    // Find accounts to delete: APPLICANT role, PENDING status, registrationPaid is false, older than 7 days
    const abandonedAccounts = await prisma.user.findMany({
      where: {
        role: 'APPLICANT',
        status: 'PENDING',
        registrationPaid: false,
        createdAt: {
          lt: sevenDaysAgo,
        },
      },
      select: { id: true },
    })

    if (abandonedAccounts.length === 0) {
      return NextResponse.json({ success: true, message: 'No abandoned accounts to clean up', deletedCount: 0 })
    }

    const accountIds = abandonedAccounts.map(a => a.id)

    // Delete accounts (Prisma Cascade will handle related profiles/records automatically)
    const result = await prisma.user.deleteMany({
      where: {
        id: { in: accountIds }
      }
    })

    console.log(`[Cron] Cleaned up ${result.count} abandoned accounts older than 7 days.`)

    return NextResponse.json({ 
      success: true, 
      message: `Cleaned up ${result.count} abandoned accounts`,
      deletedCount: result.count
    })
  } catch (error) {
    console.error('[Cron] Error cleaning up abandoned accounts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
