import { NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth/helpers'
import prisma from '@/lib/prisma/client'

export async function GET() {
  try {
    const session = await getAuthSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const pools = await prisma.examPool.findMany({
      where: {
        status: {
          in: ['OPEN', 'NEAR_FULL', 'CONFIRMED', 'DRAFT'],
        },
      },
      include: {
        event: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        examDate: 'asc',
      },
    })

    return NextResponse.json(
      pools.map((pool) => ({
        id: pool.id,
        name: pool.name,
        examDate: pool.examDate.toISOString(),
        examStartTime: pool.examStartTime.toISOString(),
        examEndTime: pool.examEndTime.toISOString(),
        status: pool.status,
        currentMemberCount: pool.currentMemberCount,
        maxCandidates: pool.maxCandidates,
        seatPrice: Number(pool.seatPrice),
        allowedModules: pool.allowedModules || [],
        event: {
          name: pool.event.name,
        },
        modules: pool.preSeedModules || [],
      }))
    )
  } catch (error) {
    console.error('Error fetching pools:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
