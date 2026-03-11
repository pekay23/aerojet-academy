import { NextRequest, NextResponse } from 'next/server'
import { requireStaff } from '@/lib/auth/helpers'
import { redistributeAutoPool } from '@/lib/pools/auto-pool'
import { createAuditLog } from '@/lib/audit/logger'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const staff = await requireStaff()
  const { id: eventId } = await params

  try {
    const result = await redistributeAutoPool(eventId)

    await createAuditLog({
      action: 'AUTO_POOL_REDISTRIBUTE',
      entity: 'ExamEvent',
      entityId: eventId,
      userId: staff.id,
      details: {
        trigger: 'manual',
        redistributed: result.redistributed,
        converted: result.converted,
        confirmed: result.confirmed,
      },
    })

    return NextResponse.json({
      success: true,
      message: `Redistributed ${result.redistributed} students. ${result.converted} overflow pool(s) created. ${result.confirmed} pool(s) confirmed.`,
      ...result,
    })
  } catch (error: any) {
    console.error('Redistribute error:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json(
      { error: 'Failed to redistribute auto pool. Please try again.' },
      { status: 500 }
    )
  }
}
