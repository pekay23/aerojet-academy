import { NextRequest, NextResponse } from 'next/server'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, withErrorHandler } from '@/lib/api/response'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { getAttendanceThreshold } from '@/lib/attendance'

interface EnrollmentWithCourse {
  user: {
    id: string
    email: string
    profile: { firstName: string; lastName: string } | null
    studentProfile: { studentId: string } | null
  }
  course: { code: string; name: string }
  courseId: string
}

interface AttendanceWithClass {
  userId: string
  status: string
  class: { courseId: string }
}

export const GET = withErrorHandler(async (req: NextRequest) => {
  await requireStaff()
  const url = new URL(req.url)
  const courseId = url.searchParams.get('courseId')
  const moduleCode = url.searchParams.get('moduleCode')
  const format = url.searchParams.get('format') // 'json' or 'csv'

  const { effective: threshold } = await getAttendanceThreshold()

  // Get all active students with their enrollments
  const enrollments = await prismaUnfiltered.enrollment.findMany({
    where: {
      status: { in: ['ENROLLED', 'ACTIVE', 'APPROVED'] },
      ...(courseId ? { courseId } : {}),
      ...(moduleCode ? { course: { code: moduleCode } } : {}),
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          profile: { select: { firstName: true, lastName: true } },
          studentProfile: { select: { studentId: true } },
        },
      },
      course: { select: { code: true, name: true } },
    },
  })

  const studentIds = enrollments.map((e: EnrollmentWithCourse) => e.user.id)

  const records = await prismaUnfiltered.attendanceRecord.findMany({
    where: { userId: { in: studentIds } },
    include: {
      class: { select: { id: true, name: true, courseId: true } },
    },
  })

  const recordsByUser = new Map<string, AttendanceWithClass[]>()
  for (const r of records) {
    const list = recordsByUser.get(r.userId) || []
    list.push(r as AttendanceWithClass)
    recordsByUser.set(r.userId, list)
  }

  const report = enrollments.map((e: EnrollmentWithCourse) => {
    const userRecords = recordsByUser.get(e.user.id) || []
    const courseRecords = userRecords.filter((r: AttendanceWithClass) => r.class.courseId === e.courseId)
    const total = courseRecords.length
    const present = courseRecords.filter((r: AttendanceWithClass) => r.status === 'PRESENT' || r.status === 'LATE').length
    const rate = total > 0 ? Math.round((present / total) * 100) : 0
    const absent = courseRecords.filter((r: AttendanceWithClass) => r.status === 'ABSENT').length
    const excused = courseRecords.filter((r: AttendanceWithClass) => r.status === 'EXCUSED').length
    const complianceStatus = rate >= threshold ? 'COMPLIANT' : rate >= threshold - 5 ? 'AT_RISK' : 'NON_COMPLIANT'

    return {
      userId: e.user.id,
      studentId: e.user.studentProfile?.studentId,
      name: `${e.user.profile?.firstName || ''} ${e.user.profile?.lastName || ''}`.trim() || e.user.email,
      email: e.user.email,
      courseId: e.courseId,
      moduleCode: e.course.code,
      moduleName: e.course.name,
      total,
      present,
      absent,
      excused,
      rate,
      complianceStatus,
      threshold,
    }
  })

  if (format === 'csv') {
    const headers = [
      'Student ID',
      'Name',
      'Email',
      'Module Code',
      'Module Name',
      'Total Sessions',
      'Present',
      'Absent',
      'Excused',
      'Rate %',
      'Threshold %',
      'Compliance Status',
    ]
    const rows = [headers.join(',')]
    for (const r of report) {
      rows.push(
        [
          r.studentId || '',
          `"${r.name.replace(/"/g, '""')}"`,
          r.email,
          r.moduleCode,
          `"${r.moduleName.replace(/"/g, '""')}"`,
          r.total,
          r.present,
          r.absent,
          r.excused,
          r.rate,
          r.threshold,
          r.complianceStatus,
        ].join(',')
      )
    }
    const csv = rows.join('\n')
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="attendance_compliance_report.csv"',
      },
    })
  }

  return apiSuccess({ report, threshold })
})
