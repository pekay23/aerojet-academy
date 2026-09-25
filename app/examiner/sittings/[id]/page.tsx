import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { requireExaminer } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'
import Link from 'next/link'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { format } from 'date-fns'
import { SortableTh } from '@/components/ui/sortable-th'
import { buildOrderBy } from '@/lib/utils/build-order-by'
import { Prisma } from '@prisma/client'

const ALLOWED_SORT_KEYS = {
  candidate: 'user.profile.lastName',
  module: 'booking.moduleCode',
  status: 'attendanceStatus',
} as const
type SortKey = keyof typeof ALLOWED_SORT_KEYS

export const metadata: Metadata = {
  title: 'Sitting Details | Examiner Portal',
}
export const dynamic = 'force-dynamic'

export default async function ExaminerSittingPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ sort?: string; order?: string }>
}) {
  const user = await requireExaminer()

  const { id: sittingId } = await params
  const params2 = await searchParams
  const orderBy = buildOrderBy<SortKey>(params2, ALLOWED_SORT_KEYS, { assignedAt: 'asc' })

  const examiner = await prismaUnfiltered.examiner.findUnique({
    where: { userId: user.id },
    select: { id: true },
  })

  const sitting = await prismaUnfiltered.examSitting.findUnique({
    where: { id: sittingId },
    include: {
      event: { select: { name: true } },
      examComponent: { include: { course: { select: { code: true, name: true } } } },
      assignments: {
        include: {
          user: { include: { profile: { select: { firstName: true, lastName: true } } } },
          booking: { select: { moduleCode: true, examId: true } },
        },
        orderBy: orderBy as unknown as Prisma.ExamSittingAssignmentOrderByWithRelationInput,
      },
    },
  })

  if (!sitting || !examiner || sitting.examinerId !== examiner.id) {
    notFound()
  }

  return (
    <div className="mx-auto max-w-350 space-y-8">
      <div>
        <Link
          href="/examiner"
          className="hover:text-aerojet-sky mb-2 inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Examiner Hub
        </Link>
        <h1 className="text-aerojet-blue text-3xl font-black tracking-tight dark:text-white">
          {sitting.examComponent?.course?.name || sitting.examComponent?.name || 'Exam Sitting'}
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {sitting.event?.name} &middot; Day {sitting.dayNumber} {sitting.sessionType} &middot;{' '}
          {format(new Date(sitting.startTime), 'EEEE, MMM do yyyy @ HH:mm')}
        </p>
      </div>

      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800 dark:border-blue-900/40 dark:bg-blue-900/20 dark:text-blue-200">
        <div className="flex items-start gap-2">
          <ExternalLink className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Exam invigilation is managed on the{' '}
            <a
              href="https://www.suntech-bc.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold underline"
            >
              suntech-bc.com
            </a>{' '}
            examiner portal. Use this page to review assigned candidates and record final results.
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80 text-left dark:border-slate-800 dark:bg-slate-900/50">
              <SortableTh sortKey="candidate" label="Candidate" />
              <SortableTh sortKey="module" label="Module" />
              <SortableTh sortKey="status" label="Status" align="center" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
            {sitting.assignments.map((a) => (
              <tr key={a.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">
                  {a.user.profile
                    ? `${a.user.profile.firstName} ${a.user.profile.lastName}`
                    : a.userId}
                </td>
                <td className="px-4 py-3 font-mono text-slate-500">
                  {a.booking?.moduleCode ?? sitting.examComponent?.course?.code ?? '—'}
                </td>
                <td className="px-4 py-3 text-center text-slate-600">
                  {a.attendanceStatus ?? 'Pending'}
                </td>
              </tr>
            ))}
            {sitting.assignments.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-sm text-slate-400">
                  No candidates assigned to this sitting yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
