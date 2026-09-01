import type { Metadata } from 'next'
import { requireExaminer } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'
import Link from 'next/link'
import { ArrowLeft, FileSearch } from 'lucide-react'
import { format } from 'date-fns'
import { SortableTh } from '@/components/ui/sortable-th'
import { buildOrderBy } from '@/lib/utils/build-order-by'
import { Prisma } from '@prisma/client'

const ALLOWED_SORT_KEYS = {
  candidate: 'user.profile.lastName',
  module: 'moduleCode',
  score: 'score',
  result: 'passed',
  grade: 'grade',
  submitted: 'createdAt',
} as const
type SortKey = keyof typeof ALLOWED_SORT_KEYS

export const metadata: Metadata = { title: 'Results History | Examiner Portal' }
export const dynamic = 'force-dynamic'

export default async function ExaminerResultsHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; order?: string }>
}) {
  const user = await requireExaminer()

  const params = await searchParams
  const orderBy = buildOrderBy<SortKey>(params, ALLOWED_SORT_KEYS, { createdAt: 'desc' })

  const examiner = await prismaUnfiltered.examiner.findUnique({
    where: { userId: user.id },
    select: { id: true },
  })

  if (!examiner) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-12 text-center dark:border-slate-700 dark:bg-slate-800/50">
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Examiner profile not found</h3>
      </div>
    )
  }

  const sittingIds = (
    await prismaUnfiltered.examSitting.findMany({
      where: { examinerId: examiner.id },
      select: { id: true },
    })
  ).map((s) => s.id)

  const assignmentUserIds = sittingIds.length
    ? (
        await prismaUnfiltered.examSittingAssignment.findMany({
          where: { sittingId: { in: sittingIds } },
          select: { userId: true },
        })
      ).map((a) => a.userId)
    : []
  const userIds = [...new Set(assignmentUserIds.filter((id): id is string => Boolean(id)))]

  const [results, users] = await Promise.all([
    userIds.length
      ? prismaUnfiltered.examResult.findMany({
          where: { userId: { in: userIds }, examCategory: 'OFFICIAL_EASA' },
          orderBy: orderBy as unknown as Prisma.ExamResultOrderByWithRelationInput,
          take: 200,
          select: {
            id: true,
            userId: true,
            moduleCode: true,
            score: true,
            passed: true,
            grade: true,
            createdAt: true,
          },
        })
      : [],
    userIds.length
      ? prismaUnfiltered.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, profile: { select: { firstName: true, lastName: true } } },
        })
      : [],
  ])

  const nameById = new Map(
    users.map((u) => [u.id, u.profile ? `${u.profile.firstName} ${u.profile.lastName}` : u.id])
  )

  return (
    <div className="mx-auto max-w-[1100px] space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <Link
          href="/examiner/results"
          className="mb-2 inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 transition-colors hover:text-aerojet-sky"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Results Entry
        </Link>
        <h1 className="text-3xl font-black tracking-tight text-aerojet-blue dark:text-white">
          Results History
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Previously submitted official EASA results for candidates in your assigned sittings.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80 text-left dark:border-slate-800 dark:bg-slate-900/50">
              <th className="px-4 py-3 text-[10px] font-black tracking-widest text-slate-400 uppercase">Candidate</th>
              <th className="px-4 py-3 text-[10px] font-black tracking-widest text-slate-400 uppercase">Module</th>
              <th className="px-4 py-3 text-center text-[10px] font-black tracking-widest text-slate-400 uppercase">Score</th>
              <th className="px-4 py-3 text-center text-[10px] font-black tracking-widest text-slate-400 uppercase">Result</th>
              <th className="px-4 py-3 text-center text-[10px] font-black tracking-widest text-slate-400 uppercase">Grade</th>
              <th className="px-4 py-3 text-[10px] font-black tracking-widest text-slate-400 uppercase">Submitted</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
            {results.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-400">
                  No results recorded yet.
                </td>
              </tr>
            ) : (
              results.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">
                    {nameById.get(r.userId) ?? r.userId}
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-500">{r.moduleCode ?? '—'}</td>
                  <td className="px-4 py-3 text-center font-mono">{r.score != null ? `${r.score}%` : '—'}</td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-black uppercase ${
                        r.passed
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {r.passed ? 'Pass' : 'Fail'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center font-mono text-slate-500">{r.grade}</td>
                  <td className="px-4 py-3 text-slate-500">
                    {format(new Date(r.createdAt), 'MMM d, yyyy HH:mm')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {results.length === 0 && (
        <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-white p-4 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900/50">
          <FileSearch className="h-4 w-4 shrink-0" />
          Once you submit results from the Results Entry page they will appear here for review.
        </div>
      )}
    </div>
  )
}
