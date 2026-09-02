'use client'

import { useState, useMemo } from 'react'
import TablePagination from '@/components/shared/TablePagination'
import { ACADEMIC_RULES } from '@/lib/constants/business-rules'
import { useSort, SortHeader } from '@/lib/hooks/useSort'

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

/** EASA grading: ≥75% = Pass, <75% = Fail */
function getPassFail(grade: string | null, percentage: string): { label: string; isPassing: boolean } {
  // If a letter grade exists, map it
  if (grade) {
    const g = grade.toUpperCase()
    if (['A', 'B', 'C', 'P'].includes(g)) return { label: 'Pass', isPassing: true }
    if (g === 'F') return { label: 'Fail', isPassing: false }
  }
  // Fall back to percentage threshold
  return Number(percentage) >= ACADEMIC_RULES.GRADE_THRESHOLD_PASS
    ? { label: 'Pass', isPassing: true }
    : { label: 'Fail', isPassing: false }
}

export default function GradesTable({ grades }: { grades: Grade[] }) {
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(25)

  const sortableGrades = useMemo(
    () =>
      grades.map((g) => ({
        ...g,
        _percentage: Number(g.percentage),
        _dateTs: new Date(g.assessmentDate).getTime(),
      })),
    [grades]
  )
  const { items: sortedGrades, requestSort, sortConfig } = useSort(sortableGrades)
  const paged = sortedGrades.slice((page - 1) * perPage, page * perPage)

  const total = sortedGrades.length

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
                  <SortHeader label="Assessment" sortKey="assessmentName" currentSort={sortConfig} onSort={requestSort} className="px-6 py-4" />
                  <SortHeader label="Course / Module" sortKey="enrollment.course.name" currentSort={sortConfig} onSort={requestSort} className="px-6 py-4" />
                  <SortHeader label="Score" sortKey="_percentage" currentSort={sortConfig} onSort={requestSort} align="right" className="px-6 py-4" />
                  <SortHeader label="Result" sortKey="_percentage" currentSort={sortConfig} onSort={requestSort} align="center" className="px-6 py-4" />
                  <SortHeader label="Date" sortKey="_dateTs" currentSort={sortConfig} onSort={requestSort} align="right" className="px-6 py-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {paged.map((grade) => {
                  const { label, isPassing } = getPassFail(grade.grade, grade.percentage)
                  return (
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
                              className={`h-full rounded-full ${
                                Number(grade.percentage) >= ACADEMIC_RULES.GRADE_THRESHOLD_PASS
                                  ? 'bg-green-500'
                                  : 'bg-red-500'
                              }`}
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
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black uppercase tracking-tight ${
                            isPassing
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                              : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                          }`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${isPassing ? 'bg-emerald-500' : 'bg-red-500'}`} />
                          {label}
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
                  )
                })}
              </tbody>
            </table>
          </div>
          
          {/* Legend */}
          <div className="border-t border-slate-100 bg-slate-50/50 px-6 py-3 dark:border-slate-800 dark:bg-slate-800/20">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[10px] font-medium text-slate-400">
              <span className="font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Legend:</span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                Pass ≥ 75%
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2 w-2 rounded-full bg-red-500" />
                Fail &lt; 75%
              </span>
              <span className="text-slate-300 dark:text-slate-600">|</span>
              <span>EASA minimum passing score: 75%</span>
            </div>
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

