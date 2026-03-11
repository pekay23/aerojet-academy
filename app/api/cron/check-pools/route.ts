import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma/client'
import { failPool } from '@/lib/pools/operations'
import { redistributeAutoPool } from '@/lib/pools/auto-pool'
import { createAuditLog } from '@/lib/audit/logger'
import { env } from '@/lib/env'

// Cron job: Check pools that should be auto-confirmed or failed
// Runs daily — pools that haven't reached 25 members by T-21 days before exam are failed
export async function GET(req: NextRequest) {
  // Verify cron secret strictly
  const authHeader = req.headers.get('authorization')
  const cronSecret = env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const now = new Date()
    const cutoffDate = new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000) // T-21 days

    // Step 0: Redistribute auto pools for events at or past payment deadline
    const eventsAtDeadline = await prisma.examEvent.findMany({
      where: {
        paymentDeadline: { lte: now },
        status: { in: ['OPEN', 'CONFIRMED'] },
        pools: {
          some: { poolType: 'AUTO', isAutoPool: true, status: { in: ['OPEN', 'DRAFT'] } },
        },
      },
      select: { id: true, name: true },
    })

    const redistributionResults = { events: 0, redistributed: 0, errors: [] as string[] }
    for (const event of eventsAtDeadline) {
      try {
        const result = await redistributeAutoPool(event.id)
        redistributionResults.events++
        redistributionResults.redistributed += result.redistributed
      } catch (err: any) {
        redistributionResults.errors.push(`Event ${event.id}: ${err.message}`)
      }
    }

    // Find OPEN/NEAR_FULL pools where exam date is within 21 days and not enough members
    const poolsToFail = await prisma.examPool.findMany({
      where: {
        status: { in: ['OPEN', 'NEAR_FULL'] },
        examDate: { lte: cutoffDate },
        currentMemberCount: { lt: 25 },
      },
      include: {
        memberships: { where: { status: 'RESERVED' } },
        event: { select: { name: true } },
      },
    })

    const results = {
      checked: poolsToFail.length,
      failed: 0,
      errors: [] as string[],
    }

    for (const pool of poolsToFail) {
      try {
        await failPool(pool.id)
        results.failed++

        await createAuditLog({
          action: 'POOL_FAIL',
          entity: 'ExamPool',
          entityId: pool.id,
          details: {
            reason: 'Auto-failed: insufficient members by T-21 cutoff',
            memberCount: pool.currentMemberCount,
            examDate: pool.examDate.toISOString(),
          },
        })
      } catch (err: any) {
        results.errors.push(`Pool ${pool.id}: ${err.message}`)
      }
    }

    // Also check pools that hit 25+ and should auto-confirm
    const poolsToConfirm = await prisma.examPool.findMany({
      where: {
        status: { in: ['OPEN', 'NEAR_FULL'] },
        currentMemberCount: { gte: 25 },
      },
    })

    let confirmed = 0
    for (const pool of poolsToConfirm) {
      try {
        // Import confirmPool dynamically to avoid circular
        const { confirmPool } = await import('@/lib/pools/operations')
        await confirmPool(pool.id, 'SYSTEM')
        confirmed++
      } catch (err: any) {
        results.errors.push(`Confirm pool ${pool.id}: ${err.message}`)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Pool check completed',
      results: { ...results, confirmed, redistribution: redistributionResults },
      timestamp: now.toISOString(),
    })
  } catch (error: any) {
    console.error('Cron check-pools error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
