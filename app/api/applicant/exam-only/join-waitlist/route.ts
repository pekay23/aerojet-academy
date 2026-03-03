import { NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth/helpers'
import prisma from '@/lib/prisma/client'
import { joinWaitlist } from '@/lib/pools/waitlist'

export async function POST(req: Request) {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { poolId, moduleCode } = await req.json()

    if (!poolId || !moduleCode) {
      return NextResponse.json({ error: 'Missing poolId or moduleCode' }, { status: 400 })
    }

    // Find the exam component ID from the module code
    const component = await prisma.examComponent.findUnique({
      where: { code: moduleCode },
    })

    if (!component) {
      return NextResponse.json({ error: 'Invalid module code' }, { status: 400 })
    }

    const result = await joinWaitlist(poolId, session.user.id, component.id)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true, entry: result.entry })
  } catch (error: any) {
    console.error('[JOIN WAITLIST API ERROR]', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
