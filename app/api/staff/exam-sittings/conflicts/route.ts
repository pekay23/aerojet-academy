import { NextRequest, NextResponse } from 'next/server'
import { requireStaff } from '@/lib/auth/helpers'
import { detectSchedulingConflicts } from '@/lib/exams/scheduler'

export async function GET(req: NextRequest) {
  try {
    await requireStaff()

    const eventId = req.nextUrl.searchParams.get('eventId')
    if (!eventId) {
      return NextResponse.json({ error: 'Missing eventId' }, { status: 400 })
    }

    const conflicts = await detectSchedulingConflicts(eventId)
    return NextResponse.json({ conflicts })
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to detect conflicts' },
      { status: 500 }
    )
  }
}
