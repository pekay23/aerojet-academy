import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { requireAuth } from '@/lib/auth/helpers'
import { apiSuccess, apiForbidden, withErrorHandler } from '@/lib/api/response'
import { UserRole } from '@prisma/client'
import { getInstructorProfileByUserId } from '@/lib/instructor/profile'

export const GET = withErrorHandler(async (req: NextRequest) => {
  const user = await requireAuth()
  if (user.role !== UserRole.INSTRUCTOR) return apiForbidden('Instructor access required')
  const instructorProfile = await getInstructorProfileByUserId(user.id)
  if (!instructorProfile) return apiForbidden('Instructor profile not found')

  const { searchParams } = new URL(req.url)
  const startDate = searchParams.get('start')
  const endDate = searchParams.get('end')

  const where: any = { instructorId: instructorProfile.id }
  if (startDate || endDate) {
    where.startDate = {}
    if (startDate) where.startDate.gte = new Date(startDate)
    if (endDate) where.startDate.lte = new Date(endDate)
  }

  const classes = await prisma.class.findMany({
    where,
    include: {
      course: { select: { code: true, name: true, category: true } },
    },
    orderBy: { startDate: 'asc' },
  })

  return apiSuccess(classes)
})
