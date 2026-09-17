'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { AlertOctagon, User, Building2 } from 'lucide-react'

interface ConflictDto {
  kind: 'INSTRUCTOR' | 'CLASSROOM' | 'INSTRUCTOR_UNAVAILABLE'
  resourceId: string
  resourceLabel: string
  date: string
  a: { classId: string; className: string; start: string; end: string }
  b: { classId: string; className: string; start: string; end: string }
}

export default function ConflictMatrix({
  from,
  to,
  conflicts,
}: {
  from: string
  to: string
  conflicts: ConflictDto[]
}) {
  const router = useRouter()
  const [start, setStart] = useState(from)
  const [end, setEnd] = useState(to)
  const [kind, setKind] = useState<'ALL' | 'INSTRUCTOR' | 'CLASSROOM'>('ALL')

  const applyRange = () => {
    const params = new URLSearchParams({ from: start, to: end })
    router.push(`/staff/timetable/conflicts?${params}`)
  }

  // Grid: rows = resources (instructor or classroom), cols = days in range, cell = conflict count
  const days = useMemo(() => {
    const out: string[] = []
    const a = new Date(start)
    const b = new Date(end)
    for (let d = new Date(a); d <= b; d.setDate(d.getDate() + 1)) {
      out.push(d.toISOString().slice(0, 10))
    }
    return out
  }, [start, end])

  const filtered = useMemo(
    () => conflicts.filter((c) => (kind === 'ALL' ? true : c.kind === kind)),
    [conflicts, kind]
  )

  const resourceMap = useMemo(() => {
    const m = new Map<string, { kind: ConflictDto['kind']; label: string; perDay: Record<string, ConflictDto[]> }>()
    for (const c of filtered) {
      const key = `${c.kind}:${c.resourceId}`
      const entry = m.get(key) ?? { kind: c.kind, label: c.resourceLabel, perDay: {} }
      entry.perDay[c.date] = [...(entry.perDay[c.date] ?? []), c]
      m.set(key, entry)
    }
    return Array.from(m.entries()).sort(([, a], [, b]) => a.label.localeCompare(b.label))
  }, [filtered])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-2 rounded-2xl border border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div>
          <label className="block text-[10px] font-black tracking-widest text-slate-400 uppercase">From</label>
          <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800" />
        </div>
        <div>
          <label className="block text-[10px] font-black tracking-widest text-slate-400 uppercase">To</label>
          <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800" />
        </div>
        <select value={kind} onChange={(e) => setKind(e.target.value as typeof kind)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800">
          <option value="ALL">All resources</option>
          <option value="INSTRUCTOR">Instructors only</option>
          <option value="CLASSROOM">Classrooms only</option>
        </select>
        <button onClick={applyRange} className="rounded-lg bg-aerojet-blue px-3 py-2 text-sm font-bold text-white hover:bg-aerojet-blue/90">
          Apply
        </button>
        <div className="ml-auto text-sm text-slate-500">
          <span className="font-black text-red-600">{filtered.length}</span> conflict pair{filtered.length === 1 ? '' : 's'} in range.
        </div>
      </div>

      {resourceMap.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800/40">
          No conflicts in this window. 🎉
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-[10px] font-black tracking-widest text-slate-400 uppercase dark:bg-slate-800">
              <tr>
                <th className="sticky left-0 z-10 bg-slate-50 px-3 py-2 dark:bg-slate-800">Resource</th>
                {days.map((d) => (
                  <th key={d} className="px-1 py-2 text-center" title={d}>{d.slice(5)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {resourceMap.map(([key, r]) => (
                <tr key={key} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="sticky left-0 z-10 bg-white px-3 py-2 dark:bg-slate-900">
                    <div className="flex items-center gap-1.5">
                      {r.kind === 'INSTRUCTOR' ? <User className="h-3.5 w-3.5 text-indigo-500" /> : <Building2 className="h-3.5 w-3.5 text-amber-500" />}
                      <span className="font-bold text-slate-900 dark:text-slate-100">{r.label}</span>
                    </div>
                  </td>
                  {days.map((d) => {
                    const here = r.perDay[d] ?? []
                    if (here.length === 0) return <td key={d} className="px-1 py-2" />
                    return (
                      <td key={d} className="px-1 py-2 text-center">
                        <div className="group relative inline-flex h-6 w-6 cursor-default items-center justify-center rounded-md bg-red-100 text-[10px] font-black text-red-700 hover:bg-red-200">
                          {here.length}
                          <div className="invisible absolute bottom-full left-1/2 z-20 mb-1 w-64 -translate-x-1/2 rounded-lg bg-slate-900 p-3 text-left text-xs text-white shadow-lg group-hover:visible">
                            <p className="mb-1 font-black"><AlertOctagon className="inline h-3 w-3" /> {here.length} conflict{here.length === 1 ? '' : 's'}</p>
                            {here.slice(0, 3).map((c, i) => (
                              <p key={i} className="opacity-90">
                                {c.a.className} ↔ {c.b.className} ({new Date(c.a.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                              </p>
                            ))}
                            {here.length > 3 && <p className="mt-1 italic opacity-60">+{here.length - 3} more</p>}
                          </div>
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {filtered.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-[10px] font-black tracking-widest text-slate-400 uppercase dark:bg-slate-800">
              <tr>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">Resource</th>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Class A</th>
                <th className="px-3 py-2">Class B</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 100).map((c, i) => (
                <tr key={`${c.kind}-${c.resourceId}-${i}`} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="px-3 py-2 text-xs">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-black tracking-widest uppercase ${c.kind === 'INSTRUCTOR' ? 'bg-indigo-50 text-indigo-700' : 'bg-amber-50 text-amber-700'}`}>{c.kind}</span>
                  </td>
                  <td className="px-3 py-2 font-bold">{c.resourceLabel}</td>
                  <td className="px-3 py-2 text-xs text-slate-500">{c.date}</td>
                  <td className="px-3 py-2">
                    <a href={`/staff/classes/${c.a.classId}`} className="text-aerojet-blue hover:underline">{c.a.className}</a>
                    <p className="text-[10px] text-slate-400">{new Date(c.a.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} → {new Date(c.a.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </td>
                  <td className="px-3 py-2">
                    <a href={`/staff/classes/${c.b.classId}`} className="text-aerojet-blue hover:underline">{c.b.className}</a>
                    <p className="text-[10px] text-slate-400">{new Date(c.b.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} → {new Date(c.b.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length > 100 && (
            <div className="px-3 py-2 text-center text-xs text-slate-400">Showing first 100. Narrow the date range to see more.</div>
          )}
        </div>
      )}
    </div>
  )
}
