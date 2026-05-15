import { NextRequest } from 'next/server'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { prismaUnfiltered } from '@/lib/prisma/client'

/**
 * GET /api/staff/attendance/summary?userId=xxx
 * Returns per-module and overall attendance % for a student.
 * Also returns cumulative training hours toward 2,400h target.
 */
export const GET = withErrorHandler(async (req: NextRequest, _ctx: any) => {
  await requireStaff()
  const url = new URL(req.url)
  const userId = url.searchParams.get('userId')
  if (!userId) return apiError('userId is required')

  // All attendance records for this user
  const records = await prismaUnfiltered.attendanceRecord.findMany({
    where: { userId },
    include: {
      class: { select: { id: true, name: true, courseId: true } },
    },
  })

  // Group by class
  const byClass: Record<string, { className: string; total: number; present: number; courseId: string }> = {}
  for (const r of records) {
    if (!byClass[r.classId]) {
      byClass[r.classId] = { className: r.class.name, total: 0, present: 0, courseId: r.class.courseId }
    }
    byClass[r.classId].total++
    if (r.status === 'PRESENT' || r.status === 'LATE') {
      byClass[r.classId].present++
    }
  }

  const classSummaries = Object.entries(byClass).map(([classId, data]) => ({
    classId,
    className: data.className,
    courseId: data.courseId,
    total: data.total,
    present: data.present,
    rate: data.total > 0 ? Math.round((data.present / data.total) * 100) : 0,
    belowThreshold: data.total > 0 ? (data.present / data.total) * 100 < 90 : false,
  }))

  // Overall
  const totalRecords = records.length
  const totalPresent = records.filter(r => r.status === 'PRESENT' || r.status === 'LATE').length
  const overallRate = totalRecords > 0 ? Math.round((totalPresent / totalRecords) * 100) : 0

  // Cumulative training hours (from ClassSessions the student has attended)
  const attendedClassIds = [...new Set(records.filter(r => r.status === 'PRESENT' || r.status === 'LATE').map(r => r.classId))]
  const sessions = attendedClassIds.length > 0
    ? await prismaUnfiltered.classSession.findMany({
        where: { classId: { in: attendedClassIds } },
        select: { instructionalHours: true },
      })
    : []

  const totalTrainingHours = Math.round(sessions.reduce((s, sess) => s + sess.instructionalHours, 0) * 10) / 10
  const TARGET_HOURS = 2400

  return apiSuccess({
    classSummaries,
    overall: { total: totalRecords, present: totalPresent, rate: overallRate },
    trainingHours: { completed: totalTrainingHours, target: TARGET_HOURS, percent: Math.round((totalTrainingHours / TARGET_HOURS) * 100) },
  })
})
