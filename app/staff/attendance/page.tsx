import { Metadata } from 'next'
import { requireStaff } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'
import AttendanceManager from './_components/AttendanceManager'

export const metadata: Metadata = { title: 'Attendance | Staff' }
export const dynamic = 'force-dynamic'

export default async function AttendancePage() {
  await requireStaff()

  // Get classes that have upcoming or recent dates, plus any class
  // that has attendance records so marked attendance is always visible.
  // eslint-disable-next-line react-hooks/purity
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)

  const [dateFilteredClasses, classIdsWithAttendance] = await Promise.all([
    prismaUnfiltered.class.findMany({
      where: {
        endDate: { gte: ninetyDaysAgo }, // last 90 days or future
      },
      select: { id: true, name: true, courseId: true },
      orderBy: { name: 'asc' },
    }),
    prismaUnfiltered.attendanceRecord.findMany({
      select: { classId: true },
      distinct: ['classId'],
    }),
  ])

  const attendanceClassIds = new Set(classIdsWithAttendance.map((r) => r.classId))
  const seen = new Set(dateFilteredClasses.map((c) => c.id))
  const extraClasses = [...attendanceClassIds].filter((id) => !seen.has(id))

  let classes = dateFilteredClasses
  if (extraClasses.length > 0) {
    const extra = await prismaUnfiltered.class.findMany({
      where: { id: { in: extraClasses } },
      select: { id: true, name: true, courseId: true },
    })
    classes = [...dateFilteredClasses, ...extra].sort((a, b) => a.name.localeCompare(b.name))
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-aerojet-blue text-2xl font-black uppercase sm:text-3xl dark:text-white">
          Attendance Tracking
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Mark attendance for class sessions. Attendance must meet the 90% threshold for module
          completion.
        </p>
      </div>

      <AttendanceManager classes={classes} />
    </div>
  )
}
