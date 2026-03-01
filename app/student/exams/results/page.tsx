import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Award, CheckCircle2, XCircle, FileBarChart2 } from 'lucide-react'

import { getAuthSession } from '@/lib/auth/helpers'
import prisma from '@/lib/prisma/client'

export const metadata: Metadata = { title: 'Exam Results | Student Portal' }
export const dynamic = 'force-dynamic'

export default async function ExamResultsPage() {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const results = await prisma.examResult.findMany({
    where: {
      userId: session.user.id,
    },
    include: {
      exam: {
        include: { examComponent: { include: { course: true } } },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
          Exam Results
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Your examination scores and grades.</p>
      </div>

      {results.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800/50">
            <FileBarChart2 className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">No Results Available</h3>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            You haven&apos;t taken any exams yet, or your results are pending publication.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((result) => (
            <div
              key={result.id}
              className="flex flex-col justify-between rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm transition-all hover:shadow-md"
            >
              <div>
                <div className="mb-4 flex items-start justify-between">
                  <div className="rounded-lg bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-blue-600">
                    {result.exam.examComponent?.course?.code || '—'}
                  </div>
                  {result.passed ? (
                    <div className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-600">
                      <CheckCircle2 className="h-3 w-3" />
                      Passed
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold uppercase text-red-600">
                      <XCircle className="h-3 w-3" />
                      Failed
                    </div>
                  )}
                </div>
                <h3 className="mb-1 text-lg font-bold text-slate-900 dark:text-slate-100">{result.exam.examComponent?.course?.name || 'Unknown'}</h3>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{result.exam.name}</p>
              </div>

              <div className="mt-6 space-y-4 border-t border-slate-100 dark:border-slate-800 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase text-slate-400">Score</p>
                    <p className="text-xl font-black text-slate-900 dark:text-slate-100">
                      {Number(result.score)} / {Number(result.maxScore)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase text-slate-400">Grade</p>
                    <p
                      className={`text-xl font-black ${
                        result.passed ? 'text-emerald-600' : 'text-red-600'
                      }`}
                    >
                      {result.grade || '-'}
                    </p>
                  </div>
                </div>

                {result.certificateUrl && (
                  <a
                    href={result.certificateUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-2 text-xs font-bold uppercase text-white transition-colors hover:bg-slate-800"
                  >
                    <Award className="h-4 w-4" />
                    Download Certificate
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
