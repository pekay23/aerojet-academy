'use client'

import { useState, useTransition } from 'react'
import { Calendar, Users, Save, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { submitExaminerResults } from '../actions'

interface Assignment {
  id: string
  userId: string
  user: { id: string; profile: { firstName: string; lastName: string } | null }
  booking: { moduleCode: string | null; examId: string | null } | null
}

interface Sitting {
  id: string
  dayNumber: number
  sessionType: string
  startTime: string
  status: string
  venue: string | null
  event: { name: string } | null
  examComponent: { course: { code: string; name: string } | null } | null
  assignments: Assignment[]
}

interface ExistingResult {
  userId: string
  moduleCode: string | null
  examId: string | null
  score: number | null
  passed: boolean
}

export default function ResultsEntry({
  sittings,
  existingResults,
}: {
  sittings: Sitting[]
  existingResults: ExistingResult[]
}) {
  const [active, setActive] = useState<string>(sittings[0]?.id ?? '')
  const sitting = sittings.find((s) => s.id === active) ?? sittings[0]

  const existingFor = (a: Assignment) =>
    existingResults.find(
      (r) =>
        r.userId === a.userId &&
        ((a.booking?.examId && r.examId === a.booking.examId) ||
          (a.booking?.moduleCode && r.moduleCode === a.booking.moduleCode))
    )

  const [scores, setScores] = useState<Record<string, string>>({})
  const [absent, setAbsent] = useState<Record<string, boolean>>({})
  const [isPending, startTransition] = useTransition()

  const save = () => {
    if (!sitting) return
    const entries = sitting.assignments.map((a) => ({
      assignmentId: a.id,
      absent: !!absent[a.id],
      score: scores[a.id] !== undefined && scores[a.id] !== '' ? Number(scores[a.id]) : null,
    }))
    const hasData = entries.some((e) => e.absent || e.score != null)
    if (!hasData) {
      toast.error('Enter at least one score or mark a candidate absent.')
      return
    }
    startTransition(async () => {
      const res = await submitExaminerResults(sitting.id, entries)
      if (res.error) toast.error(res.error)
      else toast.success(`${res.recorded} result(s) recorded`)
    })
  }

  if (!sitting) return null

  return (
    <div className="space-y-6">
      {/* Sitting selector */}
      <div className="flex flex-wrap gap-2">
        {sittings.map((s) => (
          <button
            key={s.id}
            onClick={() => setActive(s.id)}
            className={`rounded-full border px-3 py-1.5 text-xs font-bold transition-all ${
              s.id === active
                ? 'border-aerojet-blue bg-aerojet-blue text-white'
                : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800'
            }`}
          >
            {s.examComponent?.course?.code ?? 'Exam'} · Day {s.dayNumber} {s.sessionType}
          </button>
        ))}
      </div>

      {/* Sitting header */}
      <div className="rounded-2xl border border-slate-100 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          <span className="font-black text-slate-900 dark:text-slate-100">
            {sitting.examComponent?.course?.name ?? 'Exam'}
          </span>
          <span className="flex items-center gap-1.5 text-slate-500">
            <Calendar className="h-4 w-4" />
            {new Date(sitting.startTime).toLocaleString('en-GB', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
          <span className="flex items-center gap-1.5 text-slate-500">
            <Users className="h-4 w-4" />
            {sitting.assignments.length} candidate(s)
          </span>
          {sitting.venue && <span className="text-slate-500">Venue: {sitting.venue}</span>}
        </div>
      </div>

      {/* Candidate result table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80 text-left dark:border-slate-800 dark:bg-slate-900/50">
              <th className="px-4 py-3 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                Candidate
              </th>
              <th className="px-4 py-3 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                Module
              </th>
              <th className="px-4 py-3 text-center text-[10px] font-black tracking-widest text-slate-400 uppercase">
                Existing
              </th>
              <th className="px-4 py-3 text-center text-[10px] font-black tracking-widest text-slate-400 uppercase">
                Score (%)
              </th>
              <th className="px-4 py-3 text-center text-[10px] font-black tracking-widest text-slate-400 uppercase">
                Absent
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
            {sitting.assignments.map((a) => {
              const ex = existingFor(a)
              return (
                <tr key={a.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">
                    {a.user.profile
                      ? `${a.user.profile.firstName} ${a.user.profile.lastName}`
                      : a.userId}
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-500">
                    {a.booking?.moduleCode ?? sitting.examComponent?.course?.code ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {ex ? (
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-black uppercase ${
                          ex.passed
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        <CheckCircle2 className="h-3 w-3" /> {ex.score ?? '—'}%
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      disabled={absent[a.id]}
                      value={scores[a.id] ?? ''}
                      onChange={(e) =>
                        setScores((s) => ({ ...s, [a.id]: e.target.value }))
                      }
                      placeholder={ex?.score != null ? String(ex.score) : '—'}
                      className="w-20 rounded border border-slate-200 px-2 py-1 text-center font-mono text-xs disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800"
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={!!absent[a.id]}
                      onChange={(e) =>
                        setAbsent((s) => ({ ...s, [a.id]: e.target.checked }))
                      }
                      className="h-4 w-4 rounded border-slate-300"
                    />
                  </td>
                </tr>
              )
            })}
            {sitting.assignments.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-400">
                  No candidates assigned to this sitting yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end">
        <button
          onClick={save}
          disabled={isPending || sitting.assignments.length === 0}
          className="flex items-center gap-2 rounded-xl bg-aerojet-blue px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-aerojet-blue/90 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {isPending ? 'Saving…' : 'Save Results'}
        </button>
      </div>
    </div>
  )
}
