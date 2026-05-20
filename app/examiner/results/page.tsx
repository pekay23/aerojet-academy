import { Metadata } from 'next'
import { ClipboardCheck, ExternalLink } from 'lucide-react'

import { requireExaminer } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { serializePrisma } from '@/lib/utils/serialization'
import ResultsEntry from './_components/ResultsEntry'

export const metadata: Metadata = { title: 'Results Entry | Examiner Portal' }
export const dynamic = 'force-dynamic'

export default async function ExaminerResultsPage() {
  const user = await requireExaminer()

  const examiner = await prismaUnfiltered.examiner.findUnique({
    where: { userId: user.id },
    include: {
      sittings: {
        orderBy: { startTime: 'desc' },
        include: {
          event: { select: { name: true } },
          examComponent: { include: { course: { select: { code: true, name: true } } } },
          assignments: {
            include: {
              user: { select: { id: true, profile: { select: { firstName: true, lastName: true } } } },
              booking: { select: { moduleCode: true, examId: true } },
            },
          },
        },
      },
    },
  })

  const sittings = examiner?.sittings ?? []

  // Pre-fill existing official results for these candidates/modules.
  const userIds = [...new Set(sittings.flatMap((s) => s.assignments.map((a) => a.userId)))]
  const existingResults = userIds.length
    ? await prismaUnfiltered.examResult.findMany({
        where: { userId: { in: userIds }, examCategory: 'OFFICIAL_EASA' },
        select: { userId: true, moduleCode: true, examId: true, score: true, passed: true },
      })
    : []

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-aerojet-blue dark:text-white">
          Results Entry
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Enter or upload results for sittings assigned to you.
        </p>
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50 p-3 text-sm text-blue-800 dark:border-blue-900/40 dark:bg-blue-900/20 dark:text-blue-200">
          <ExternalLink className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <p>
            Exams are started, stopped and managed on the{' '}
            <a
              href="https://www.suntech-bc.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold underline"
            >
              suntech-bc.com
            </a>{' '}
            examiner portal. Use this page only to record the final results here.
          </p>
        </div>
      </div>

      {sittings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-12 text-center dark:border-slate-700 dark:bg-slate-800/50">
          <ClipboardCheck className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            No sittings assigned
          </h3>
          <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
            Sittings assigned to you by staff will appear here for result entry.
          </p>
        </div>
      ) : (
        <ResultsEntry
          sittings={serializePrisma(sittings)}
          existingResults={serializePrisma(existingResults)}
        />
      )}
    </div>
  )
}
