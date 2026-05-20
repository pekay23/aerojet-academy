import { NextRequest } from 'next/server'
import { withErrorHandler, apiPaginated, parsePagination } from '@/lib/api/response'
import { requireStaff } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'

export const GET = withErrorHandler(async (req: NextRequest) => {
  await requireStaff()
  const url = new URL(req.url)
  const { page, limit, skip } = parsePagination(url.searchParams)

  const statusParam = url.searchParams.get('status') ?? 'all'
  const search = url.searchParams.get('search')?.trim().toLowerCase() ?? ''

  const where: any = {}
  if (statusParam !== 'all') {
    where.status = statusParam as 'SUCCESS' | 'FAILED' | 'RETRYING'
  }
  if (search) {
    where.OR = [
      { recipient: { contains: search, mode: 'insensitive' } },
      { subject: { contains: search, mode: 'insensitive' } },
      { error: { contains: search, mode: 'insensitive' } },
    ]
  }

  const [rows, total] = await Promise.all([
    prismaUnfiltered.emailDelivery.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prismaUnfiltered.emailDelivery.count({ where }),
  ])

  return apiPaginated(rows, total, page, limit)
})
