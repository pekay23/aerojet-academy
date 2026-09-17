import { NextRequest } from 'next/server'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { requireInstructor } from '@/lib/auth/helpers'
import { apiPaginated, apiForbidden, withErrorHandler } from '@/lib/api/response'
import { parsePagination } from '@/lib/api/response'
import { getInstructorProfileByUserId } from '@/lib/instructor/profile'

export const GET = withErrorHandler(async (req: NextRequest) => {
  const user = await requireInstructor()
  const instructorProfile = await getInstructorProfileByUserId(user.id)
  if (!instructorProfile) return apiForbidden('Instructor profile not found')

  const { searchParams } = new URL(req.url)
  const { page, limit, skip } = parsePagination(searchParams)

  const where = { instructorId: instructorProfile.id }

  const [classes, total] = await Promise.all([
    prismaUnfiltered.class.findMany({
      where,
      include: {
        course: { select: { id: true, name: true, code: true } },
        _count: { select: { internalExamClassSchedules: true, internalExamSessions: true } },
        internalExamClassSchedules: {
          where: { isActive: true },
          include: {
            bank: { select: { id: true, name: true, moduleCode: true, mcqCount: true } },
          },
          orderBy: { scheduledStart: 'asc' },
        },
      },
      orderBy: { startDate: 'desc' },
      take: limit,
      skip,
    }),
    prismaUnfiltered.class.count({ where }),
  ])

  const enriched = classes.map((cls) => {
    const enrolledCount = cls.currentStudents
    const scheduledExamsCount = cls._count.internalExamClassSchedules

    const sessions = cls._count.internalExamSessions
    const completionRate = sessions > 0 ? Math.round((cls._count.internalExamSessions / Math.max(enrolledCount, 1)) * 100) : 0

    return {
      id: cls.id,
      name: cls.name,
      course: cls.course,
      enrolledCount,
      scheduledExamsCount,
      completionRate,
      startDate: cls.startDate,
      endDate: cls.endDate,
      schedules: cls.internalExamClassSchedules.map((s) => ({
        id: s.id,
        bankId: s.bankId,
        bankName: s.bank.name,
        bankModuleCode: s.bank.moduleCode,
        bankMcqCount: s.bank.mcqCount,
        scheduledStart: s.scheduledStart?.toISOString() || null,
        scheduledEnd: s.scheduledEnd?.toISOString() || null,
        allowLateStart: s.allowLateStart,
        sebRequired: s.sebRequired,
      })),
    }
  })

  return apiPaginated(enriched, total, page, limit)
})
