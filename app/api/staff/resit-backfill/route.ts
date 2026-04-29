import { NextRequest, NextResponse } from 'next/server'
import { requireStaff } from '@/lib/auth/helpers'
import { createAuditLog } from '@/lib/audit/logger'
import {
  generateResitBackfillProposals,
  executeResitBackfill,
} from '@/lib/exams/resits'
import { revalidatePath } from 'next/cache'

/**
 * GET  — generate dry-run backfill proposals for an event
 * POST — execute approved proposals
 */

export async function GET(req: NextRequest) {
  try {
    await requireStaff()
    const eventId = req.nextUrl.searchParams.get('eventId')
    if (!eventId) return NextResponse.json({ error: 'Missing eventId' }, { status: 400 })

    const result = await generateResitBackfillProposals(eventId)
    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to generate proposals' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const staff = await requireStaff()
    const body = await req.json()
    const { eventId, proposals } = body

    if (!eventId || !Array.isArray(proposals) || proposals.length === 0) {
      return NextResponse.json({ error: 'Missing eventId or proposals' }, { status: 400 })
    }

    const result = await executeResitBackfill(proposals, staff.id)

    await createAuditLog({
      action: 'UPDATE',
      entity: 'ExamEvent',
      entityId: eventId,
      userId: staff.id,
      details: {
        source: 'resit-backfill',
        assignedCount: result.assignedCount,
        skippedCount: result.skippedCount,
        proposalCount: proposals.length,
      },
    })

    revalidatePath(`/staff/exams/events/${eventId}`)
    revalidatePath('/staff/exams')

    return NextResponse.json({
      success: true,
      ...result,
      message: `Assigned ${result.assignedCount} resit seat(s). ${result.skippedCount} skipped (already assigned or no capacity).`,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to execute backfill' }, { status: 500 })
  }
}
