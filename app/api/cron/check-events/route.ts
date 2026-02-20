import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma/client'
import { createAuditLog } from '@/lib/audit/logger'

// Cron job: Check exam events for automatic status transitions
// - OPEN events past end date → mark COMPLETED
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const now = new Date()
    const results = { completed: 0, errors: [] as string[] }

    // Mark past events as COMPLETED (valid statuses: OPEN, CONFIRMED)
    const pastEvents = await prisma.examEvent.findMany({
      where: {
        status: { in: ['OPEN', 'CONFIRMED'] },
        endDate: { lt: now },
      },
    })

    for (const event of pastEvents) {
      try {
        await prisma.examEvent.update({
          where: { id: event.id },
          data: { status: 'COMPLETED' },
        })
        results.completed++

        await createAuditLog({
          action: 'UPDATE',
          entity: 'ExamEvent',
          entityId: event.id,
          userId: undefined,
          details: { transition: 'auto-completed', previousStatus: event.status },
        })
      } catch (err: any) {
        results.errors.push(`Event ${event.id}: ${err.message}`)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Event check completed',
      results,
      timestamp: now.toISOString(),
    })
  } catch (error: any) {
    console.error('Cron check-events error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
