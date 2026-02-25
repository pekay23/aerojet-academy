import { Metadata } from 'next'
import { getAuthSession } from '@/lib/auth/helpers'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma/client'
import { BookMarked } from 'lucide-react'
import AcademicCalendarManager from './_components/AcademicCalendarManager'

export const metadata: Metadata = { title: 'Academic Calendar Management | Staff Portal' }
export const dynamic = 'force-dynamic'

export default async function AcademicCalendarPage() {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const academicYears = await prisma.academicYear.findMany({
    include: {
      semesters: { orderBy: { startDate: 'asc' } },
      _count: { select: { classes: true } },
    },
    orderBy: { startDate: 'desc' },
  })

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="flex items-center gap-3 text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">
          <BookMarked className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          Academic Calendar
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Manage global Academic Years and Semesters used for class scheduling and milestones.
        </p>
      </div>

      <AcademicCalendarManager initialYears={academicYears} />
    </div>
  )
}
