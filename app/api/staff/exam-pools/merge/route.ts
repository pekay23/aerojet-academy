import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { canMergePools, mergePools } from '@/lib/pools/operations'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF')) {
      return new NextResponse('Unauthorized', { status: 403 })
    }

    const body = await request.json()
    const { poolAId, poolBId } = body

    if (!poolAId || !poolBId) {
      return NextResponse.json({ error: 'Both poolAId and poolBId are required' }, { status: 400 })
    }

    const result = await mergePools(poolAId, poolBId, session.user.id)
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('[POOL_MERGE]', error)
    return NextResponse.json(
      { error: error.message || 'Failed to merge pools' },
      { status: 400 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF')) {
      return new NextResponse('Unauthorized', { status: 403 })
    }

    const body = await request.json()
    const { poolAId, poolBId } = body

    if (!poolAId || !poolBId) {
      return NextResponse.json({ error: 'Both poolAId and poolBId are required' }, { status: 400 })
    }

    const result = await canMergePools(poolAId, poolBId)
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('[POOL_MERGE_VALIDATE]', error)
    return NextResponse.json(
      { error: error.message || 'Failed to validate merge' },
      { status: 400 }
    )
  }
}
