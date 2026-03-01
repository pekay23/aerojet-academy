import { getAuthSession } from '@/lib/auth/helpers'
import { redirect } from 'next/navigation'
import { Trophy, BookOpen, Calendar } from 'lucide-react'
import prisma from '@/lib/prisma/client'
import { format } from 'date-fns'
import { Metadata } from 'next'
import SearchInput from '@/components/SearchInput'

export const metadata: Metadata = { title: 'Exam Results | Staff Portal' }

interface PageProps {
  searchParams: Promise<{ query?: string }>
}

export default async function ExamResultsPage({ searchParams }: PageProps) {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const { query } = await searchParams
  const results = await prisma.examResult.findMany({
    where: query
      ? {
          OR: [
            {
              user: {
                OR: [
                  { email: { contains: query } },
                  { profile: { firstName: { contains: query } } },
                  { profile: { lastName: { contains: query } } },
                ],
              },
            },
            { exam: { examComponent: { course: { code: { contains: query } } } } },
          ],
        }
      : undefined,
    include: {
      user: {
        include: {
          profile: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      },
      exam: {
        include: {
          examComponent: {
            include: {
              course: { select: { name: true, code: true } },
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-[#002a5c] dark:text-white">
            Exam Results
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            View and manage student exam performance
          </p>
        </div>
        <div className="w-full max-w-sm">
          <SearchInput placeholder="Search students, exams, or modules..." />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase dark:bg-slate-800/50 dark:text-slate-400">
              <tr>
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">Module / Exam</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Score</th>
                <th className="px-6 py-4">Result</th>
                <th className="px-6 py-4 text-right">Certificate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {results.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800/50">
                      <Trophy className="h-6 w-6 text-slate-300" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      No results found
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {query
                        ? 'Try adjusting your search terms.'
                        : 'Results will appear here once exams are completed and graded.'}
                    </p>
                  </td>
                </tr>
              ) : (
                results.map((result) => (
                  <tr key={result.id} className="group dark:bg-slate-800/50 hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 font-bold text-[#002a5c]">
                          {result.user.profile?.firstName?.charAt(0)}
                          {result.user.profile?.lastName?.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-slate-100">
                            {result.user.profile?.firstName} {result.user.profile?.lastName}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {result.user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-[#002a5c]" />
                        <span className="font-medium text-slate-700">
                          {result.exam.examComponent?.course?.code || '—'} - {result.exam.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <Calendar className="h-3 w-3" />
                        {format(result.exam.examDate, 'MMM d, yyyy')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 dark:text-slate-100">
                        {Number(result.score)}%
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-1 text-[10px] font-bold uppercase ${
                          result.passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {result.passed ? 'PASS' : 'FAIL'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {result.certificateUrl ? (
                        <a
                          href={result.certificateUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-bold text-[#002a5c] hover:underline"
                        >
                          View
                        </a>
                      ) : (
                        <span className="text-xs text-slate-400">Not available</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

