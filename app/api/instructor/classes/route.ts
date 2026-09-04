import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { requireAuth } from '@/lib/auth/helpers'
import { apiForbidden, apiPaginated, withErrorHandler } from '@/lib/api/response'
import { parsePagination } from '@/lib/api/response'
import { getInstructorProfileByUserId } from '@/lib/instructor/profile'
import { UserRole } from '@prisma/client'

export const GET = withErrorHandler(async (req: NextRequest) => {
  const user = await requireAuth()
  if (user.role !== UserRole.INSTRUCTOR) return apiForbidden('Instructor access required')

  const instructorProfile = await getInstructorProfileByUserId(user.id)
  if (!instructorProfile) return apiForbidden('Instructor profile not found')

  const { searchParams } = new URL(req.url)
  const { page, limit, skip } = parsePagination(searchParams)
  const upcoming = searchParams.get('upcoming') === 'true'

  const where: any = { instructorId: instructorProfile.id }
  if (upcoming) where.startDate = { gte: new Date() }

  const [classes, total] = await Promise.all([
    prisma.class.findMany({
      where,
      include: {
        course: { select: { code: true, name: true } },
        _count: { select: { attendanceRecords: true } },
      },
      orderBy: { startDate: upcoming ? 'asc' : 'desc' },
      take: limit,
      skip,
    }),
    prisma.class.count({ where }),
  ])

  return apiPaginated(classes, total, page, limit)
})
