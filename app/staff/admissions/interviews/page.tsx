import { Metadata } from 'next'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { requireStaff } from '@/lib/auth/helpers'
import InterviewSchedulesManager from './_components/InterviewSchedulesManager'
import InterviewOutcomesTable from './_components/InterviewOutcomesTable'

export const metadata: Metadata = { title: 'Interview Management' }
export const dynamic = 'force-dynamic'

export default async function InterviewsPage() {
  await requireStaff()

  const [applications, schedules] = await Promise.all([
    prismaUnfiltered.application.findMany({
      where: {
        stage: {
          in: ['INTERVIEW_PENDING', 'INTERVIEW_SCHEDULED', 'INTERVIEW_COMPLETED']
        }
      },
      include: {
        user: { include: { profile: true } },
        intakeCycle: true,
        interviewSlot: { include: { schedule: true } }
      },
      orderBy: { updatedAt: 'desc' }
    }),
    prismaUnfiltered.interviewSchedule.findMany({
      include: {
        slots: {
          include: {
            _count: { select: { applications: true } }
          },
          orderBy: { date: 'asc' }
        },
        intakeCycle: true,
      },
      orderBy: { createdAt: 'desc' }
    }),
  ])

  // Format data for the table
  const tableData = applications.map((app) => ({
    id: app.id,
    applicantName: `${app.user.profile?.firstName} ${app.user.profile?.lastName}`,
    email: app.user.email,
    programmeChoice: app.programmeChoice,
    intakeCycle: app.intakeCycle?.name || 'Unknown Cycle',
    stage: app.stage,
    slot: app.interviewSlot ? {
      date: app.interviewSlot.date.toISOString(),
      startTime: app.interviewSlot.startTime.toISOString(),
      endTime: app.interviewSlot.endTime.toISOString(),
      location: app.interviewSlot.location,
    } : null,
    metadata: app.metadata,
  }))

  const scheduleData = schedules.map(s => ({
    ...s,
    startDate: s.startDate.toISOString(),
    endDate: s.endDate.toISOString(),
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
    slots: s.slots.map(sl => ({
      ...sl,
      date: sl.date.toISOString(),
      startTime: sl.startTime.toISOString(),
      endTime: sl.endTime.toISOString(),
      createdAt: sl.createdAt.toISOString(),
      updatedAt: sl.updatedAt.toISOString(),
    }))
  }))

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-aerojet-blue dark:text-white">Interview Management</h1>
        <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
          Manage interview schedules, slots, and record outcomes for shortlisted candidates.
        </p>
      </div>

      <InterviewSchedulesManager initialSchedules={scheduleData as any} />

      <div>
        <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white mb-4">Candidate Interviews</h2>
        <InterviewOutcomesTable data={tableData} />
      </div>
    </div>
  )
}
