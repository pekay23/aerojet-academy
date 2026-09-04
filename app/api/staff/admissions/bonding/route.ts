import { NextRequest } from 'next/server'
import { requireStaff } from '@/lib/auth/helpers'
import { apiPaginated, withErrorHandler, parsePagination } from '@/lib/api/response'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { BondingStatus, Prisma } from '@prisma/client'

export const GET = withErrorHandler(async (req: NextRequest) => {
  await requireStaff()

  const url = new URL(req.url)
  const { page, limit, skip } = parsePagination(url.searchParams)
  const status = url.searchParams.get('status') as BondingStatus | null
  const search = url.searchParams.get('search')?.trim()

  const where: Prisma.BondingContractWhereInput = {}

  if (status && Object.values(BondingStatus).includes(status)) {
    where.status = status
  }

  if (search) {
    where.OR = [
      { application: { user: { email: { contains: search, mode: 'insensitive' } } } },
      { application: { user: { profile: { firstName: { contains: search, mode: 'insensitive' } } } } },
      { application: { user: { profile: { lastName: { contains: search, mode: 'insensitive' } } } } },
      { studentProfile: { studentId: { contains: search, mode: 'insensitive' } } },
      { facilityName: { contains: search, mode: 'insensitive' } },
    ]
  }

  const [contracts, total, statusCounts] = await Promise.all([
    prismaUnfiltered.bondingContract.findMany({
      where,
      include: {
        application: {
          select: {
            programmeChoice: true,
            fundingType: true,
            user: {
              select: {
                id: true,
                email: true,
                profile: { select: { firstName: true, lastName: true } },
              },
            },
          },
        },
        studentProfile: {
          select: { studentId: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prismaUnfiltered.bondingContract.count({ where }),
    prismaUnfiltered.bondingContract.groupBy({
      by: ['status'],
      _count: { status: true },
    }),
  ])

  const counts: Record<string, number> = {}
  for (const s of statusCounts) {
    counts[s.status] = s._count.status
  }

  return apiPaginated(contracts, total, page, limit, { statusCounts: counts })
})
