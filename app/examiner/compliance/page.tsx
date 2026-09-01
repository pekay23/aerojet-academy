import { Metadata } from 'next'
import { requireExaminer } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { ShieldCheck, CheckCircle2, Clock, FileText, AlertTriangle } from 'lucide-react'
import { format } from 'date-fns'

export const metadata: Metadata = { title: 'Compliance | Examiner Portal' }

export default async function ExaminerCompliancePage() {
  const user = await requireExaminer()

  const examiner = await prismaUnfiltered.examiner.findUnique({
    where: { userId: user.id },
    include: {
      user: {
        include: {
          profile: { select: { firstName: true, lastName: true } },
        },
      },
    },
  })

  if (!examiner) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 dark:border-slate-800 dark:bg-slate-900">
        <AlertTriangle className="mb-4 h-12 w-12 text-amber-400" />
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Examiner Profile Not Found</h3>
        <p className="mt-2 text-sm text-slate-500">Contact administration to set up your examiner profile.</p>
      </div>
    )
  }

  const [completedSittings, upcomingSittings] = await Promise.all([
    prismaUnfiltered.examSitting.count({
      where: { examinerId: examiner.id, status: 'COMPLETED' },
    }),
    prismaUnfiltered.examSitting.count({
      where: {
        examinerId: examiner.id,
        status: { in: ['DRAFT', 'OPEN', 'SCHEDULED', 'CONFIRMED'] },
        startTime: { gte: new Date() },
      },
    }),
  ])

  const fullName = examiner.user.profile
    ? `${examiner.user.profile.firstName} ${examiner.user.profile.lastName}`
    : examiner.user.email

  const stats = [
    { label: 'Status', value: examiner.isActive ? 'Active' : 'Inactive', icon: ShieldCheck, color: examiner.isActive ? 'text-emerald-600' : 'text-red-600' },
    { label: 'Completed Sessions', value: completedSittings.toString(), icon: CheckCircle2, color: 'text-blue-600' },
    { label: 'Upcoming Sessions', value: upcomingSittings.toString(), icon: Clock, color: 'text-amber-600' },
    { label: 'Max Parallel Sittings', value: (examiner.maxParallelSittings ?? 0).toString(), icon: FileText, color: 'text-indigo-600' },
  ]

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-aerojet-blue dark:text-white">
          Compliance Overview
        </h1>
        <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
          Your examiner authorization and invigilation compliance record.
        </p>
      </div>

      {/* Profile Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-aerojet-blue/10 text-aerojet-blue dark:bg-blue-900/20 dark:text-blue-400">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">{fullName}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Authorized Examiner &middot; Since {format(new Date(examiner.createdAt), 'MMM yyyy')}
            </p>
          </div>
          <div className="ml-auto">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-black ${
              examiner.isActive
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
            }`}>
              <span className={`h-2 w-2 rounded-full ${examiner.isActive ? 'bg-emerald-500' : 'bg-red-500'}`} />
              {examiner.isActive ? 'Active Authorization' : 'Inactive'}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400">{stat.label}</span>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
            <p className={`mt-2 text-2xl font-black ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Notes */}
      {examiner.notes && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="mb-3 text-xs font-black uppercase tracking-widest text-slate-400">Administrative Notes</h3>
          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">{examiner.notes}</p>
        </div>
      )}

      {/* Compliance Reminders */}
      <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-6 dark:border-amber-500/20 dark:bg-amber-500/5">
        <h3 className="mb-3 text-xs font-black uppercase tracking-widest text-amber-600 dark:text-amber-400">
          EASA Compliance Reminders
        </h3>
        <ul className="space-y-2 text-sm text-amber-800 dark:text-amber-300">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
            All examination sessions must be conducted under EASA Part-66 invigilation standards.
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
            Ensure candidate identity verification before each session.
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
            Report any irregularities to the Quality Manager within 24 hours.
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
            Maintain confidentiality of all examination materials at all times.
          </li>
        </ul>
      </div>
    </div>
  )
}
