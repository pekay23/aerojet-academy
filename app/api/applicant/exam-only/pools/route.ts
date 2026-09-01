import { NextResponse } from 'next/server'
import { requireApplicant } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { withErrorHandler } from '@/lib/api/response'

export const GET = withErrorHandler(async () => {
  await requireApplicant()

  const pools = await prismaUnfiltered.examPool.findMany({
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
})
