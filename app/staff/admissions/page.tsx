import { getAuthSession } from '@/lib/auth/helpers'
import { redirect } from 'next/navigation'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { ApplicationStage, ProgrammeChoice } from '@prisma/client'
import { format } from 'date-fns'
import { Metadata } from 'next'
import Link from 'next/link'
import {
  Users,
  UserCheck,
  GraduationCap,
  XCircle,
  ChevronRight,
  ArrowRight,
  Sparkles,
} from 'lucide-react'
import PipelineFilters from './_components/PipelineFilters'
import {
  STAGE_INFO,
  STAGE_GROUPS,
  STAGE_GROUP_LABELS,
  type StageGroup,
} from '@/lib/admissions/constants'

export const metadata: Metadata = { title: 'Admissions Pipeline | Staff Portal' }

/* ─────────────────────── Programme label helper ─────────────────────── */

const PROGRAMME_LABELS: Record<ProgrammeChoice, string> = {
  FULL_TIME_4YEAR: '4-Year B1/B2',
  FULL_TIME_2YEAR: '2-Year B1',
  MILITARY_1YEAR: 'Military/Industry',
  MODULAR: 'Modular',
  EXAM_ONLY: 'Exam Only',
}

/* ─────────────────────── Active (non-terminal) stages ─────────────────────── */

const TERMINAL_STAGES: ApplicationStage[] = [
  ApplicationStage.ENROLLED,
  ApplicationStage.REJECTED,
  ApplicationStage.WITHDRAWN,
]

/* ─────────────────────── Page ─────────────────────── */

export default async function AdmissionsPipelinePage({
  searchParams,
}: {
  searchParams: Promise<{ cycle?: string; programme?: string }>
}) {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const { cycle, programme } = await searchParams

  /* ── Build dynamic where clause ── */
  const where: Record<string, unknown> = {}
  if (cycle) where.intakeCycleId = cycle
  if (programme) where.programmeChoice = programme

  /* ── Parallel data fetches ── */
  const [
    stageCountsRaw,
    programmeCounts,
    recentApplications,
    intakeCycles,
  ] = await Promise.all([
    // 1. Count per stage
    prismaUnfiltered.application.groupBy({
      by: ['stage'],
      _count: { id: true },
      where,
    }),
    // 2. Count per programme
    prismaUnfiltered.application.groupBy({
      by: ['programmeChoice'],
      _count: { id: true },
      where,
    }),
    // 3. Recent 10 applications
    prismaUnfiltered.application.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        stage: true,
        programmeChoice: true,
        createdAt: true,
        user: {
          select: {
            email: true,
            profile: {
              select: { firstName: true, lastName: true },
            },
          },
        },
      },
    }),
    // 4. Intake cycles for filter
    prismaUnfiltered.intakeCycle.findMany({
      orderBy: { startDate: 'desc' },
      select: { id: true, name: true, isActive: true },
      take: 20,
    }),
  ])

  /* ── Derive stats ── */
  const stageMap = new Map(
    stageCountsRaw.map((s) => [s.stage, s._count.id])
  )

  const totalApplications = stageCountsRaw.reduce(
    (sum, s) => sum + s._count.id,
    0
  )
  const activeApplications = stageCountsRaw
    .filter((s) => !TERMINAL_STAGES.includes(s.stage))
    .reduce((sum, s) => sum + s._count.id, 0)
  const enrolledCount = stageMap.get(ApplicationStage.ENROLLED) ?? 0
  const rejectedCount = stageMap.get(ApplicationStage.REJECTED) ?? 0

  /* ── Group stages by stage group for funnel ── */
  const stagesByGroup = new Map<StageGroup, { stage: ApplicationStage; count: number }[]>()
  for (const group of STAGE_GROUPS) {
    stagesByGroup.set(group, [])
  }
  // Also include terminal
  stagesByGroup.set('terminal', [])

  for (const [stage, info] of Object.entries(STAGE_INFO)) {
    const s = stage as ApplicationStage
    const count = stageMap.get(s) ?? 0
    const arr = stagesByGroup.get(info.group)
    if (arr) arr.push({ stage: s, count })
  }

  return (
    <div className="mx-auto max-w-[1920px] space-y-8">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-aerojet-blue sm:text-4xl dark:text-white">
            Admissions Pipeline
          </h1>
          <p className="mt-1 flex items-center gap-2 text-base font-medium text-slate-500 dark:text-slate-400">
            <Sparkles className="h-5 w-5 text-aerojet-sky" />
            Track applicants across every stage of the admissions process.
          </p>
        </div>

        <PipelineFilters intakeCycles={intakeCycles} />
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Applications"
          value={totalApplications}
          icon={Users}
          color="bg-blue-50 text-blue-600"
        />
        <StatCard
          title="Active in Pipeline"
          value={activeApplications}
          icon={UserCheck}
          color="bg-amber-50 text-amber-600"
        />
        <StatCard
          title="Enrolled"
          value={enrolledCount}
          icon={GraduationCap}
          color="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          title="Rejected / Withdrawn"
          value={rejectedCount + (stageMap.get(ApplicationStage.WITHDRAWN) ?? 0)}
          icon={XCircle}
          color="bg-red-50 text-red-600"
        />
      </div>

      {/* ── Pipeline Funnel ── */}
      <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
        <div className="mb-6">
          <h2 className="text-lg font-black text-aerojet-blue dark:text-white">
            Pipeline Funnel
          </h2>
          <p className="text-sm font-medium text-slate-400">
            Applicant distribution across stage groups
          </p>
        </div>

        <div className="space-y-4">
          {[...STAGE_GROUPS, 'terminal' as const].map((group) => {
            const stages = stagesByGroup.get(group) ?? []
            const groupTotal = stages.reduce((s, st) => s + st.count, 0)
            if (groupTotal === 0 && group === 'terminal') return null

            const barWidth =
              totalApplications > 0
                ? Math.max((groupTotal / totalApplications) * 100, 2)
                : 0

            return (
              <div key={group}>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-xs font-black tracking-widest text-slate-500 uppercase dark:text-slate-400">
                    {STAGE_GROUP_LABELS[group]}
                  </h3>
                  <span className="text-sm font-black text-aerojet-blue dark:text-slate-100">
                    {groupTotal}
                  </span>
                </div>

                {/* Bar */}
                <div className="mb-2 h-3 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      group === 'terminal'
                        ? 'bg-slate-400'
                        : group === 'enrollment'
                          ? 'bg-emerald-500'
                          : 'bg-aerojet-blue'
                    }`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>

                {/* Stage badges */}
                <div className="flex flex-wrap gap-2">
                  {stages
                    .filter((st) => st.count > 0)
                    .map((st) => {
                      const info = STAGE_INFO[st.stage]
                      return (
                        <span
                          key={st.stage}
                          className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-bold ${info.color} ${info.textColor}`}
                        >
                          {info.shortLabel}
                          <span className="rounded-md bg-white/60 px-1.5 py-0.5 text-[10px] font-black dark:bg-black/20">
                            {st.count}
                          </span>
                        </span>
                      )
                    })}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Bottom Grid: Programme Breakdown + Recent Applications ── */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Programme Breakdown */}
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
          <h2 className="mb-1 text-sm font-black tracking-widest text-aerojet-blue uppercase dark:text-white">
            By Programme
          </h2>
          <p className="mb-6 text-xs font-medium text-slate-400">
            Application distribution
          </p>

          <div className="space-y-4">
            {Object.values(ProgrammeChoice).map((pc) => {
              const count =
                programmeCounts.find((p) => p.programmeChoice === pc)?._count
                  .id ?? 0
              const pct =
                totalApplications > 0
                  ? Math.round((count / totalApplications) * 100)
                  : 0

              return (
                <div key={pc}>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                      {PROGRAMME_LABELS[pc]}
                    </span>
                    <span className="text-xs font-black text-aerojet-blue dark:text-slate-100">
                      {count}
                      <span className="ml-1 text-[10px] font-bold text-slate-400">
                        ({pct}%)
                      </span>
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full bg-indigo-500 transition-all duration-500"
                      style={{
                        width: `${totalApplications > 0 ? Math.max((count / totalApplications) * 100, count > 0 ? 2 : 0) : 0}%`,
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Recent Applications Table */}
        <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm lg:col-span-2 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/30 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/30">
            <h3 className="text-sm font-black tracking-widest text-aerojet-blue uppercase dark:text-slate-100">
              Recent Applications
            </h3>
            <Link
              href="/staff/users?tab=applicants"
              className="flex items-center gap-1 text-xs font-bold text-aerojet-blue transition-colors hover:text-aerojet-sky dark:text-aerojet-sky"
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/50 text-[10px] font-black tracking-widest text-slate-400 uppercase dark:bg-slate-800/20">
                <tr>
                  <th className="px-6 py-4">Applicant</th>
                  <th className="px-6 py-4">Programme</th>
                  <th className="px-6 py-4">Stage</th>
                  <th className="px-6 py-4 text-right">Applied</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentApplications.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-12 text-center text-sm font-medium text-slate-400 italic"
                    >
                      No applications found.
                    </td>
                  </tr>
                ) : (
                  recentApplications.map((app) => {
                    const info = STAGE_INFO[app.stage]
                    const name = app.user.profile
                      ? `${app.user.profile.firstName} ${app.user.profile.lastName}`
                      : app.user.email

                    return (
                      <tr
                        key={app.id}
                        className="group transition-all duration-150 ease-out hover:bg-slate-50/50 dark:hover:bg-slate-800/40"
                      >
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-black text-aerojet-blue dark:text-slate-100">
                              {name}
                            </span>
                            <span className="text-[10px] font-bold tracking-tighter text-slate-400 uppercase">
                              {app.user.email}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-black text-slate-600 uppercase dark:bg-slate-800 dark:text-slate-400">
                            {PROGRAMME_LABELS[app.programmeChoice]}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-bold ${info.color} ${info.textColor}`}
                          >
                            {info.shortLabel}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-mono text-xs font-bold text-slate-400">
                          {format(new Date(app.createdAt), 'MMM d, yyyy')}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Quick Links ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <QuickLink
          href="/staff/admissions/intake-cycles"
          title="Intake Cycles"
          description="Manage admission intake cycles and deadlines"
        />
        <QuickLink
          href="/staff/admissions/document-types"
          title="Document Types"
          description="Configure required application documents"
        />
        <QuickLink
          href="/staff/users?tab=applicants"
          title="All Applicants"
          description="View and manage individual applicant records"
        />
      </div>
    </div>
  )
}

/* ─────────────────────── Sub-components ─────────────────────── */

function StatCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string
  value: number
  icon: React.ComponentType<{ className?: string }>
  color: string
}) {
  return (
    <div className="group relative overflow-hidden rounded-3xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:shadow-xl dark:border-slate-800 dark:bg-slate-900">
      <div
        className={`absolute -right-4 -top-4 h-24 w-24 rounded-full opacity-[0.03] transition-transform group-hover:scale-150 ${color}`}
      />
      <div className="relative flex items-start justify-between">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl ${color} ring-4 ring-white transition-transform group-hover:scale-110 dark:ring-slate-900`}
        >
          <Icon className="h-6 w-6" />
        </div>
      </div>
      <div className="mt-4">
        <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
          {title}
        </p>
        <h3 className="text-3xl font-black text-aerojet-blue dark:text-slate-100">
          {value}
        </h3>
      </div>
    </div>
  )
}

function QuickLink({
  href,
  title,
  description,
}: {
  href: string
  title: string
  description: string
}) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:border-aerojet-blue/20 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900 dark:hover:border-aerojet-sky/30"
    >
      <div>
        <h3 className="font-black text-aerojet-blue dark:text-slate-100">
          {title}
        </h3>
        <p className="mt-0.5 text-xs font-medium text-slate-400">
          {description}
        </p>
      </div>
      <ChevronRight className="h-5 w-5 text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-aerojet-blue dark:text-slate-600 dark:group-hover:text-aerojet-sky" />
    </Link>
  )
}
