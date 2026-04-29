import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma/client'
import { redistributeAutoPool } from '@/lib/pools/auto-pool'
import { createAuditLog } from '@/lib/audit/logger'
import { evaluateGoNoGo, executeGo, executeNoGo } from '@/lib/events/go-no-go'
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

    // Evaluate events at or past the payment deadline using the new event-level viability rules.
    const eventsToEvaluate = await prisma.examEvent.findMany({
      where: {
        paymentDeadline: { lte: now },
        status: { in: ['OPEN', 'CONFIRMED'] },
      },
      select: { id: true, name: true, status: true },
    })

    const results = {
      checked: eventsToEvaluate.length,
      confirmedEvents: 0,
      cancelledEvents: 0,
      reviewEvents: 0,
      confirmedPools: 0,
      errors: [] as string[],
    }

    for (const event of eventsToEvaluate) {
      try {
        const evaluation = await evaluateGoNoGo(event.id, { unfiltered: true })

        if (evaluation.decision === 'GO' || evaluation.decision === 'GO_WITH_UNDERFILLED_SITTINGS') {
          if (event.status !== 'CONFIRMED') {
            await executeGo(event.id, 'SYSTEM')
            results.confirmedEvents++
          }

          const confirmablePools = await prisma.examPool.count({
            where: {
              eventId: event.id,
              status: 'LOCKED',
            },
          })
          results.confirmedPools += confirmablePools
        } else if (evaluation.decision === 'NO_GO') {
          await executeNoGo(event.id, 'SYSTEM')
          results.cancelledEvents++
        } else {
          results.reviewEvents++
        }

        await createAuditLog({
          action: 'UPDATE',
          entity: 'ExamEvent',
          entityId: event.id,
          details: {
            source: 'check-pools-cron',
            decision: evaluation.decision,
            reasons: evaluation.reasons,
          },
        })
      } catch (err: any) {
        results.errors.push(`Event ${event.id}: ${err.message}`)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Pool check completed',
      results: { ...results, redistribution: redistributionResults },
      timestamp: now.toISOString(),
    })
  } catch (error: any) {
    console.error('Cron check-pools error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
