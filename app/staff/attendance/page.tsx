import { Metadata } from 'next'
import { requireStaff } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'
import AttendanceManager from './_components/AttendanceManager'

export const metadata: Metadata = { title: 'Attendance | Staff' }
export const dynamic = 'force-dynamic'

export default async function AttendancePage() {
  await requireStaff()

  // Get classes that have upcoming or recent dates
  const classes = await prismaUnfiltered.class.findMany({
    where: {
      endDate: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // last 30 days or future
    },
    select: { id: true, name: true, courseId: true },
    orderBy: { name: 'asc' },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-aerojet-blue uppercase dark:text-white sm:text-3xl">
          Attendance Tracking
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Mark attendance for class sessions. Attendance must meet the 90% threshold for module completion.
        </p>
      </div>

      <AttendanceManager classes={classes} />
    </div>
  )
}
