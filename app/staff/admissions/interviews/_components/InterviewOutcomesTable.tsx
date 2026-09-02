'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Calendar,
  HelpCircle,
  ClipboardList,
} from 'lucide-react'
import { format } from 'date-fns'
import InterviewEvaluationForm from './InterviewEvaluationForm'
import { useSort, SortHeader } from '@/lib/hooks/useSort'

export default function InterviewOutcomesTable({ data }: { data: any[] }) {
  const router = useRouter()
  const [processing, setProcessing] = useState<string | null>(null)
  const [evaluatingApp, setEvaluatingApp] = useState<{ id: string; name: string } | null>(null)

  const sortableData = useMemo(
    () =>
      data.map((row) => ({
        ...row,
        _slotDate: row.slot?.date ? new Date(row.slot.date).getTime() : 0,
      })),
    [data]
  )
  const { items: sortedData, requestSort, sortConfig } = useSort(sortableData)

  const handleOutcome = async (
    applicationId: string,
    outcome: 'PASS' | 'FAIL' | 'CONDITIONAL' | 'NO_SHOW'
  ) => {
    let notes = ''
    let score: number | undefined

    if (outcome !== 'NO_SHOW') {
      const scoreInput = prompt(`Enter numeric score (0-100) for ${outcome}:`)
      if (scoreInput !== null && !isNaN(parseInt(scoreInput, 10))) {
        score = parseInt(scoreInput, 10)
      }
    }

    if (outcome === 'FAIL' || outcome === 'NO_SHOW' || outcome === 'CONDITIONAL') {
      const input = prompt(`Enter notes/conditions for ${outcome.replace('_', ' ')}:`)
      if (input === null && outcome !== 'CONDITIONAL') return
      notes = input || ''
    } else {
      const input = prompt('Enter positive remarks (optional):')
      if (input !== null) notes = input
    }

    setProcessing(applicationId)
    try {
      const res = await fetch('/api/staff/admissions/interviews/outcome', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId, outcome, score, notes }),
      })

      if (res.ok) {
        router.refresh()
      } else {
        toast.error('Failed to update outcome')
      }
    } finally {
      setProcessing(null)
    }
  }

  return (
    <>
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
            <tr>
              <SortHeader label="Candidate" sortKey="applicantName" currentSort={sortConfig} onSort={requestSort} className="px-4 py-3 font-medium" />
              <SortHeader label="Programme" sortKey="programmeChoice" currentSort={sortConfig} onSort={requestSort} className="px-4 py-3 font-medium" />
              <SortHeader label="Slot & Time" sortKey="_slotDate" currentSort={sortConfig} onSort={requestSort} className="px-4 py-3 font-medium" />
              <SortHeader label="Status" sortKey="stage" currentSort={sortConfig} onSort={requestSort} className="px-4 py-3 font-medium" align="center" />
              <th className="px-4 py-3 font-medium">Evaluate</th>
              <th className="px-4 py-3 font-medium text-right">Record Outcome</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {sortedData.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-500">
                  No candidates pending interviews right now.
                </td>
              </tr>
            ) : (
              sortedData.map((row) => (
                <tr
                  key={row.id}
                  className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                >
                  <td className="px-4 py-4">
                    <div className="font-bold text-slate-900 dark:text-white">
                      {row.applicantName}
                    </div>
                    <div className="text-xs text-slate-500">{row.email}</div>
                  </td>
                  <td className="px-4 py-4 text-slate-600 dark:text-slate-300">
                    {row.programmeChoice}
                    <div className="text-xs text-slate-500">{row.intakeCycle}</div>
                  </td>
                  <td className="px-4 py-4">
                    {row.slot ? (
                      <div>
                        <div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                          <Calendar className="h-3.5 w-3.5 text-aerojet-blue" />
                          {format(new Date(row.slot.date), 'MMM d, yyyy')}
                        </div>
                        <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                          <Clock className="h-3.5 w-3.5" />
                          {format(new Date(row.slot.startTime), 'h:mm a')}
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                        Not Booked Yet
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${
                        row.stage === 'INTERVIEW_COMPLETED'
                          ? 'bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400'
                          : row.stage === 'INTERVIEW_SCHEDULED'
                            ? 'bg-cyan-50 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {row.stage.replace('INTERVIEW_', '')}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <button
                      onClick={() =>
                        setEvaluatingApp({ id: row.id, name: row.applicantName })
                      }
                      className="flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 dark:border-indigo-900/50 dark:bg-indigo-900/20 dark:text-indigo-400"
                    >
                      <ClipboardList className="h-3.5 w-3.5" />
                      Evaluate
                    </button>
                  </td>
                  <td className="px-4 py-4 text-right">
                    {row.slot && row.stage !== 'INTERVIEW_COMPLETED' ? (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOutcome(row.id, 'PASS')}
                          disabled={processing === row.id}
                          className="rounded-lg border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-100 disabled:opacity-50 dark:border-green-900/50 dark:bg-green-900/20 dark:text-green-400"
                        >
                          <CheckCircle2 className="mr-1 inline-block h-3.5 w-3.5" />
                          Pass
                        </button>
                        <button
                          onClick={() => handleOutcome(row.id, 'CONDITIONAL')}
                          disabled={processing === row.id}
                          className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-50 dark:border-blue-900/50 dark:bg-blue-900/20 dark:text-blue-400"
                        >
                          <HelpCircle className="mr-1 inline-block h-3.5 w-3.5" />
                          Conditional
                        </button>
                        <button
                          onClick={() => handleOutcome(row.id, 'FAIL')}
                          disabled={processing === row.id}
                          className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400"
                        >
                          <XCircle className="mr-1 inline-block h-3.5 w-3.5" />
                          Fail
                        </button>
                        <button
                          onClick={() => handleOutcome(row.id, 'NO_SHOW')}
                          disabled={processing === row.id}
                          className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100 disabled:opacity-50 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-400"
                        >
                          <AlertCircle className="mr-1 inline-block h-3.5 w-3.5" />
                          No-Show
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">
                        {row.stage === 'INTERVIEW_COMPLETED'
                          ? 'Outcome Pending'
                          : 'Waiting for Booking'}
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Evaluation Form Modal */}
      {evaluatingApp && (
        <InterviewEvaluationForm
          applicationId={evaluatingApp.id}
          candidateName={evaluatingApp.name}
          onClose={() => setEvaluatingApp(null)}
        />
      )}
    </>
  )
}
