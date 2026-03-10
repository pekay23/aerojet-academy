'use client'

import { useState } from 'react'
import TablePagination from '@/app/staff/_components/TablePagination'

interface Grade {
  id: string
  assessmentName: string
  assessmentType: string
  percentage: string
  score: string
  maxScore: string
  grade: string | null
  assessmentDate: string
  enrollment: {
    course: {
      name: string
      code: string
    }
  }
}

export default function GradesTable({ grades }: { grades: Grade[] }) {
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(25)

  const total = grades.length
  const paged = grades.slice((page - 1) * perPage, page * perPage)

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="border-b border-slate-100 bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/50">
        <h2 className="font-bold text-slate-900 dark:text-slate-100">Academic Records</h2>
      </div>

      {paged.length > 0 ? (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm" aria-label="Academic grades">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-bold tracking-widest text-slate-400 uppercase dark:border-slate-800">
                  <th scope="col" className="px-6 py-4">Assessment</th>
                  <th scope="col" className="px-6 py-4">Course / Module</th>
                  <th scope="col" className="px-6 py-4">Score</th>
                  <th scope="col" className="px-6 py-4">Grade</th>
                  <th scope="col" className="px-6 py-4 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {paged.map((grade) => (
                  <tr
                    key={grade.id}
                    className="transition-colors hover:bg-slate-50 dark:bg-slate-800/50"
                  >
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 dark:text-slate-100">
                        {grade.assessmentName}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {grade.assessmentType}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 dark:text-slate-100">
                        {grade.enrollment.course.name}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {grade.enrollment.course.code}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`h-full rounded-full ${Number(grade.percentage) >= 75 ? 'bg-green-500' : Number(grade.percentage) >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                            style={{ width: `${grade.percentage}%` }}
                          />
                        </div>
                        <span className="font-bold text-slate-900 dark:text-slate-100">
                          {grade.percentage}%
                        </span>
                      </div>
                      <div className="text-xs text-slate-400">
                        {grade.score} / {grade.maxScore}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex h-8 w-8 items-center justify-center rounded-lg text-sm font-black ${
                          grade.grade === 'A'
                            ? 'bg-green-50 text-green-600'
                            : grade.grade === 'B'
                              ? 'bg-blue-50 text-blue-600'
                              : grade.grade === 'C'
                                ? 'bg-amber-50 text-amber-600'
                                : 'bg-red-50 text-red-600'
                        }`}
                      >
                        {grade.grade || <span aria-label="No grade assigned">&mdash;</span>}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-medium whitespace-nowrap text-slate-500 dark:text-slate-400">
                      {new Date(grade.assessmentDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <TablePagination page={page} perPage={perPage} total={total} onPageChange={setPage} onPerPageChange={setPerPage} />
        </>
      ) : (
        <div className="p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 text-slate-300 dark:bg-slate-800/50">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /></svg>
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">No grades found</h3>
          <p className="mx-auto mt-2 max-w-xs text-sm text-slate-500 dark:text-slate-400">
            Your grades will appear here once your assessments are marked by the instructors.
          </p>
        </div>
      )}
    </div>
  )
}
