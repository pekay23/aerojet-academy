'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Plus, Trash2, CalendarClock } from 'lucide-react'
import { addAvailabilitySlot, deleteAvailabilitySlot } from '@/lib/availability/actions'

interface Slot {
  id: string
  kind: string
  dayOfWeek: number | null
  date: string | null
  startTime: string
  endTime: string
  available: boolean
  notes: string | null
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

interface AvailabilityManagerProps {
  slots: Slot[]
  role?: 'instructor' | 'examiner'
}

export default function AvailabilityManager({ slots, role = 'instructor' }: AvailabilityManagerProps) {
  const [isPending, startTransition] = useTransition()
  const [form, setForm] = useState({
    kind: 'RECURRING_WEEKLY' as 'RECURRING_WEEKLY' | 'SPECIFIC_DATE',
    dayOfWeek: 1,
    date: '',
    startTime: '09:00',
    endTime: '17:00',
    available: true,
    notes: '',
  })

  const run = (fn: () => Promise<{ error?: string; success?: boolean }>, ok: string) =>
    startTransition(async () => {
      const res = await fn()
      if (res.error) toast.error(res.error)
      else toast.success(ok)
    })

  return (
    <div className="space-y-5">
      <div className="grid gap-2 rounded-2xl border border-slate-100 bg-white p-4 sm:grid-cols-7 dark:border-slate-800 dark:bg-slate-900">
        <select
          value={form.kind}
          onChange={(e) =>
            setForm((f) => ({ ...f, kind: e.target.value as typeof f.kind }))
          }
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
        >
          <option value="RECURRING_WEEKLY">Weekly</option>
          <option value="SPECIFIC_DATE">Specific date</option>
        </select>
        {form.kind === 'RECURRING_WEEKLY' ? (
          <select
            value={form.dayOfWeek}
            onChange={(e) => setForm((f) => ({ ...f, dayOfWeek: Number(e.target.value) }))}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
          >
            {DAYS.map((d, i) => (
              <option key={d} value={i}>
                {d}
              </option>
            ))}
          </select>
        ) : (
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
          />
        )}
        <input
          type="time"
          value={form.startTime}
          onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
        />
        <input
          type="time"
          value={form.endTime}
          onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
        />
        <select
          value={form.available ? '1' : '0'}
          onChange={(e) => setForm((f) => ({ ...f, available: e.target.value === '1' }))}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
        >
          <option value="1">Available</option>
          <option value="0">Unavailable</option>
        </select>
        <input
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          placeholder={role === 'examiner' ? 'Invigilation notes' : 'Notes'}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
        />
        <button
          onClick={() =>
            run(
              () =>
                addAvailabilitySlot({
                  kind: form.kind,
                  dayOfWeek: form.kind === 'RECURRING_WEEKLY' ? form.dayOfWeek : null,
                  date: form.kind === 'SPECIFIC_DATE' ? form.date : null,
                  startTime: form.startTime,
                  endTime: form.endTime,
                  available: form.available,
                  notes: form.notes,
                }),
              'Availability added'
            )
          }
          disabled={isPending}
          className="flex items-center justify-center gap-1.5 rounded-lg bg-aerojet-blue px-3 py-2 text-sm font-bold text-white hover:bg-aerojet-blue/90 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" /> Add
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80 text-left dark:border-slate-800 dark:bg-slate-900/50">
              <th className="px-4 py-3 text-[10px] font-black tracking-widest text-slate-400 uppercase">When</th>
              <th className="px-4 py-3 text-[10px] font-black tracking-widest text-slate-400 uppercase">Time</th>
              <th className="px-4 py-3 text-center text-[10px] font-black tracking-widest text-slate-400 uppercase">Status</th>
              <th className="px-4 py-3 text-[10px] font-black tracking-widest text-slate-400 uppercase">Notes</th>
              <th className="px-4 py-3 text-right text-[10px] font-black tracking-widest text-slate-400 uppercase"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
            {slots.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">
                  {s.kind === 'RECURRING_WEEKLY'
                    ? `Every ${DAYS[s.dayOfWeek ?? 0]}`
                    : s.date
                      ? new Date(s.date).toLocaleDateString('en-GB')
                      : '—'}
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                  {s.startTime} – {s.endTime}
                </td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase ${
                      s.available
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {s.available ? 'Available' : 'Unavailable'}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-slate-500">{s.notes ?? '—'}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    disabled={isPending}
                    onClick={() => run(() => deleteAvailabilitySlot(s.id), 'Removed')}
                    className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                    title="Remove"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
            {slots.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-400">
                  <CalendarClock className="mx-auto mb-2 h-8 w-8 text-slate-200" />
                  No availability set.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
