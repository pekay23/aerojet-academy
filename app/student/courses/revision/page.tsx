import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma/client'
import { getAuthSession } from '@/lib/auth/helpers'
import { Calendar, Users, BookOpen, Wallet, CheckCircle2, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import { CurrencyDisplay } from '@/components/shared/CurrencyDisplay'
import RevisionRunCard from './_components/RevisionRunCard'

export const metadata: Metadata = {
  title: 'Revision Support | Student Portal',
}

export default async function StudentRevisionPage() {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const userId = session.user.id

  const [runs, userWallet, userBookings, userEnrollments, userExamBookings] = await Promise.all([
    prisma.tuitionRun.findMany({
      where: {
        status: { in: ['OPEN', 'SCHEDULED'] },
        startDatetime: { gte: new Date() },
      },
      include: {
        creator: { select: { role: true } },
      },
      orderBy: { startDatetime: 'asc' },
    }),
    prisma.wallet.findUnique({ where: { userId } }),
    prisma.tuitionBooking.findMany({
      where: { studentId: userId },
      select: { tuitionRunId: true },
    }),
    prisma.enrollment.findMany({
      where: {
        userId,
        status: { in: ['ACTIVE', 'APPROVED', 'ENROLLED'] },
      },
      include: { course: true },
    }),
    prisma.examBooking.findMany({
      where: {
        userId,
        status: { not: 'CANCELLED' },
      },
    }),
  ])

  const bookedRunIds = new Set(userBookings.map((b) => b.tuitionRunId))

  // Collect all module codes/tags the student is associated with
  const studentModuleTags = new Set<string>()

  for (const enrollment of userEnrollments) {
    if (enrollment.course.code) {
      studentModuleTags.add(enrollment.course.code.toUpperCase().trim())
    }
  }

  for (const booking of userExamBookings) {
    if (booking.moduleCode) {
      studentModuleTags.add(booking.moduleCode.toUpperCase().trim())
    }
  }

  const isRelated = (runTag: string | null) => {
    if (!runTag) return false
    const cleanRunTag = runTag.toUpperCase().trim()
    for (const studentTag of studentModuleTags) {
      if (studentTag.includes(cleanRunTag) || cleanRunTag.includes(studentTag)) {
        return true
      }
    }
    return false
  }

  // filter out runs not created by admin/staff or system
  const adminRuns = runs.filter((run) => {
    if (!run.creator) return true // null creator is system/admin
    return ['ADMIN', 'STAFF', 'SUPER_ADMIN'].includes(run.creator.role || '')
  })

  // filter for matching related module/course or exam
  const visibleRuns = adminRuns.filter((run) => isRelated(run.moduleTag))

  const plainRuns = visibleRuns.map((run) => ({
    ...run,
    price: Number(run.price),
  }))

  return (
    <div className="space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-blue-800 dark:text-white uppercase">
            Revision Support
          </h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Extra module support and intensive revision sessions</p>
        </div>
        <div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <Wallet className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Available Funds</p>
            <CurrencyDisplay
              amount={Number(userWallet?.availableBalance || 0)}
              baseCurrency={userWallet?.currency || 'EUR'}
              size="md"
              amountClassName="text-emerald-600 dark:text-emerald-400"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {plainRuns.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center rounded-3xl border border-slate-100 bg-white py-20 text-center dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 rounded-full bg-slate-50 p-4 dark:bg-slate-800">
              <Calendar className="h-10 w-10 text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">No Sessions Available</h3>
            <p className="mx-auto mt-2 max-w-xs text-sm text-slate-500">
              Check back later for new revision sessions scheduled by our instructors.
            </p>
          </div>
        ) : (
          plainRuns.map((run) => (
            <RevisionRunCard
              key={run.id}
              run={run}
              isBooked={bookedRunIds.has(run.id)}
              walletBalance={Number(userWallet?.availableBalance || 0)}
            />
          ))
        )}
      </div>
    </div>
  )
}
