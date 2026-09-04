import { NextResponse } from 'next/server'
import { requireApplicant } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { withErrorHandler } from '@/lib/api/response'

export const GET = withErrorHandler(async () => {
  const user = await requireApplicant()

  const memberships = await prismaUnfiltered.poolMembership.findMany({
    where: { userId: user.id },
    include: {
      pool: {
        select: {
          id: true,
          name: true,
          examDate: true,
          examStartTime: true,
          examEndTime: true,
          status: true,
          currentMemberCount: true,
          minCandidates: true,
          maxCandidates: true,
        },
      },
      examComponent: {
        include: {
          course: {
            select: {
              code: true,
              name: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 50,
  })

  return NextResponse.json({
    memberships: memberships.map((m) => ({
      id: m.id,
      status: m.status,
      amountReserved: Number(m.amountReserved),
      amountPaid: Number(m.amountPaid),
      pool: {
        id: m.pool.id,
        name: m.pool.name,
        examDate: m.pool.examDate.toISOString(),
        examStartTime: m.pool.examStartTime.toISOString(),
        examEndTime: m.pool.examEndTime.toISOString(),
        status: m.pool.status,
        currentMemberCount: m.pool.currentMemberCount,
        minCandidates: m.pool.minCandidates,
        maxCandidates: m.pool.maxCandidates,
      },
      examComponent: m.examComponent
        ? {
            name: m.examComponent.name,
            course: {
              code: m.examComponent.course.code,
              name: m.examComponent.course.name,
            },
          }
        : undefined,
    })),
  })
})
