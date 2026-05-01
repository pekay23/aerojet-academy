import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { createGroupBooking } from '@/lib/pools/group-booking'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF')) {
      return new NextResponse('Unauthorized', { status: 403 })
    }

    const body = await request.json()
    const { repUserId, eventId, groupName, memberCount, modules } = body

    if (!repUserId || !eventId || !groupName || !memberCount || !modules || !modules.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const result = await createGroupBooking({
      repUserId,
      eventId,
      groupName,
      memberCount,
      modules,
    })

    return NextResponse.json({ success: true, poolId: result.pool.id })
  } catch (error: any) {
    console.error('[GROUP_CHARTER]', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create group charter booking' },
      { status: 400 }
    )
  }
}
