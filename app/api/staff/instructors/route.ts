import { NextRequest } from 'next/server'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { prismaUnfiltered } from '@/lib/prisma/client'

export const GET = withErrorHandler(async (req: NextRequest, _ctx: any) => {
  await requireStaff()

  const url = new URL(req.url)
  const page = parseInt(url.searchParams.get('page') || '1')
  const limit = parseInt(url.searchParams.get('limit') || '20')
  const search = url.searchParams.get('search') || ''

  const where: any = {
    user: { role: 'INSTRUCTOR' },
  }

  if (search) {
    where.OR = [
      { user: { email: { contains: search, mode: 'insensitive' } } },
      { user: { profile: { firstName: { contains: search, mode: 'insensitive' } } } },
      { user: { profile: { lastName: { contains: search, mode: 'insensitive' } } } },
      { employeeId: { contains: search, mode: 'insensitive' } },
    ]
  }

  const [instructors, total] = await Promise.all([
    prismaUnfiltered.instructorProfile.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            status: true,
            profile: { select: { firstName: true, lastName: true, phone: true } },
          },
        },
        instructorQualifications: {
          orderBy: { expiryDate: 'asc' },
        },
        instructorRecency: {
          orderBy: { date: 'desc' },
          take: 10,
        },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prismaUnfiltered.instructorProfile.count({ where }),
  ])

  // Calculate recency compliance (35 hours in 24 months)
  const now = new Date()
  const twentyFourMonthsAgo = new Date(now.getFullYear() - 2, now.getMonth(), now.getDate())

  const enriched = instructors.map((inst) => {
    const recentHours = inst.instructorRecency
      .filter(r => r.date >= twentyFourMonthsAgo)
      .reduce((sum, r) => sum + r.hours, 0)

    const qualExpiring = inst.instructorQualifications.filter(
      q => q.expiryDate && q.expiryDate <= new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000)
    )

    return {
      ...inst,
      recencyHours: Math.round(recentHours * 10) / 10,
      recencyCompliant: recentHours >= 35,
      expiringQualifications: qualExpiring.length,
    }
  })

  return apiSuccess({
    instructors: enriched,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  })
})
