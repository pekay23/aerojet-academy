'use client'

import { useState, useEffect, useTransition, useMemo } from 'react'
import { useDebounce } from 'use-debounce'
import { toast } from 'sonner'
import { CheckCircle2, XCircle, ShieldCheck, Plus, Search, User as UserIcon } from 'lucide-react'
import {
  requestRefund,
  staffConfirmRefund,
  rejectRefund,
  approveAndProcessRefund,
} from '@/lib/refund/actions'

interface StudentOption {
  id: string
  name: string
  email: string
  studentId: string | null
}

const CURRENCY_OPTIONS = [
  { code: 'EUR', symbol: 'â‚¬', label: 'EUR Â· â‚¬' },
  { code: 'USD', symbol: '$', label: 'USD Â· $' },
  { code: 'GHS', symbol: 'GHâ‚µ', label: 'GHS Â· GHâ‚µ' },
] as const

interface RefundRow {
  id: string
  amount: number
  currency: string
  reason: string
  status: string
  createdAt: string
  rejectedReason: string | null
  user: {
    email: string
    profile: { firstName: string; lastName: string } | null
    studentProfile: { studentId: string } | null
  }
}

const STATUS_STYLE: Record<string, string> = {
  REQUESTED: 'bg-amber-100 text-amber-700',
  STAFF_CONFIRMED: 'bg-blue-100 text-blue-700',
  ADMIN_APPROVED: 'bg-indigo-100 text-indigo-700',
  PROCESSED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-slate-100 text-slate-500',
}

export default function RefundsManager({
  refunds,
  isAdmin,
}: {
  refunds: RefundRow[]
  isAdmin: boolean
}) {
  const [isPending, startTransition] = useTransition()
  const [filter, setFilter] = useState('OPEN')
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({
    student: '',
    studentId: '' as string,
    amount: '',
    reason: '',
    currency: 'EUR' as 'EUR' | 'USD' | 'GHS',
  })

  // â”€â”€ Student search (debounced typeahead) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [studentQuery, setStudentQuery] = useState('')
  const [debouncedQuery] = useDebounce(studentQuery, 200)
  const [options, setOptions] = useState<StudentOption[]>([])
  const [searching, setSearching] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)

  useEffect(() => {
    if (!showCreate) return
    if (debouncedQuery.trim().length < 1) {
  // eslint-disable-next-line react-hooks/set-state-in-effect
  // eslint-disable-next-line react-hooks/set-state-in-effect
      setOptions([])
      return
    }
    let cancelled = false
    setSearching(true)
    ;(async () => {
      try {
        const params = new URLSearchParams({
          role: 'STUDENT',
          search: debouncedQuery.trim(),
          limit: '8',
        })
        const res = await fetch(`/api/staff/users?${params}`, { cache: 'no-store' })
        if (!res.ok) throw new Error('search failed')
        const json = await res.json()
        if (cancelled) return
        // Endpoint returns `{ data: User[] }` via apiPaginated
        const rows: any[] = json?.data ?? []
        setOptions(
          rows.map((u) => ({
            id: u.id,
            name:
              u.profile?.firstName && u.profile?.lastName
                ? `${u.profile.firstName} ${u.profile.lastName}`
                : u.email,
            email: u.email,
            studentId: u.studentProfile?.studentId ?? null,
          }))
        )
      } catch (e) {
        if (!cancelled) setOptions([])
      } finally {
        if (!cancelled) setSearching(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [debouncedQuery, showCreate])

  const pickStudent = (s: StudentOption) => {
    setForm((f) => ({ ...f, student: s.email, studentId: s.id }))
    setStudentQuery(`${s.name} Â· ${s.email}`)
    setShowDropdown(false)
  }

  const run = (fn: () => Promise<{ error?: string; success?: boolean }>, ok: string) =>
    startTransition(async () => {
      const res = await fn()
      if (res.error) toast.error(res.error)
      else toast.success(ok)
    })

  const create = () => {
    if (!form.student.trim() || !form.amount || !form.reason.trim()) {
      toast.error('Student, amount and reason are all required.')
      return
    }
    run(
      () =>
        requestRefund({
          student: form.studentId || form.student.trim(),
          amount: Number(form.amount),
          reason: form.reason.trim(),
          currency: form.currency,
        }),
      'Refund request created'
    )
    setForm({ student: '', studentId: '', amount: '', reason: '', currency: 'EUR' })
    setStudentQuery('')
    setShowCreate(false)
  }

  const visible = refunds.filter((r) =>
    filter === 'OPEN'
      ? ['REQUESTED', 'STAFF_CONFIRMED', 'ADMIN_APPROVED'].includes(r.status)
      : filter === 'ALL'
        ? true
        : r.status === filter
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {['OPEN', 'ALL', 'PROCESSED', 'REJECTED'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full border px-3 py-1 text-xs font-bold transition-all ${
                filter === f
                  ? 'border-aerojet-blue bg-aerojet-blue text-white'
                  : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowCreate((s) => !s)}
          className="flex items-center gap-1.5 rounded-xl bg-aerojet-blue px-4 py-2 text-sm font-bold text-white hover:bg-aerojet-blue/90"
        >
          <Plus className="h-4 w-4" /> New Refund
        </button>
      </div>

      {showCreate && (
        <div className="space-y-3 rounded-2xl border border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          {/* Student typeahead */}
          <div className="relative">
            <label className="mb-1 block text-[10px] font-black tracking-widest text-slate-500 uppercase">
              Student
            </label>
            <Search className="pointer-events-none absolute top-[34px] left-3 h-4 w-4 text-slate-400" />
            <input
              value={studentQuery}
              onChange={(e) => {
                setStudentQuery(e.target.value)
                setShowDropdown(true)
                // Reset the resolved id if the user is typing again
                if (form.studentId) setForm((f) => ({ ...f, studentId: '', student: '' }))
              }}
              onFocus={() => setShowDropdown(true)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
              placeholder="Search by name, email, or student IDâ€¦"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 pl-9 text-sm dark:border-slate-700 dark:bg-slate-800"
            />
            {showDropdown && (studentQuery.length > 0 || options.length > 0) && (
              <div className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
                {searching && (
                  <div className="px-3 py-2 text-xs text-slate-400">Searchingâ€¦</div>
                )}
                {!searching && options.length === 0 && studentQuery.length > 0 && (
                  <div className="px-3 py-2 text-xs text-slate-400">No matches.</div>
                )}
                {options.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => pickStudent(opt)}
                    className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <UserIcon className="h-4 w-4 shrink-0 text-slate-400" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-slate-900 dark:text-slate-100">
                        {opt.name}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {opt.email}
                        {opt.studentId && (
                          <span className="ml-2 font-mono">Â· {opt.studentId}</span>
                        )}
                      </p>
                    </div>
                    {form.studentId === opt.id && (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-4">
            {/* Amount + currency */}
            <div className="sm:col-span-2">
              <label className="mb-1 block text-[10px] font-black tracking-widest text-slate-500 uppercase">
                Amount
              </label>
              <div className="flex">
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                  placeholder="0.00"
                  className="w-full rounded-l-lg border border-r-0 border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                />
                <select
                  value={form.currency}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      currency: e.target.value as typeof form.currency,
                    }))
                  }
                  className="rounded-r-lg border border-l-0 border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-700 dark:text-slate-100"
                  aria-label="Currency"
                >
                  {CURRENCY_OPTIONS.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Reason */}
            <div className="sm:col-span-2">
              <label className="mb-1 block text-[10px] font-black tracking-widest text-slate-500 uppercase">
                Reason
              </label>
              <input
                value={form.reason}
                onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
                placeholder="Why is this refund being issued?"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={() => setShowCreate(false)}
              className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              onClick={create}
              disabled={isPending || !form.studentId || !form.amount || !form.reason}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              Create refund
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80 text-left dark:border-slate-800 dark:bg-slate-900/50">
              <th className="px-4 py-3 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                Student
              </th>
              <th className="px-4 py-3 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                Amount
              </th>
              <th className="px-4 py-3 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                Reason
              </th>
              <th className="px-4 py-3 text-center text-[10px] font-black tracking-widest text-slate-400 uppercase">
                Status
              </th>
              <th className="px-4 py-3 text-right text-[10px] font-black tracking-widest text-slate-400 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
            {visible.map((r) => {
              const name = r.user.profile
                ? `${r.user.profile.firstName} ${r.user.profile.lastName}`
                : r.user.email
              const canConfirm = r.status === 'REQUESTED'
              const canApprove =
                isAdmin && (r.status === 'REQUESTED' || r.status === 'STAFF_CONFIRMED')
              const canReject = ['REQUESTED', 'STAFF_CONFIRMED', 'ADMIN_APPROVED'].includes(
                r.status
              )
              return (
                <tr key={r.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-800 dark:text-slate-200">{name}</div>
                    <div className="text-xs text-slate-400">
                      {r.user.studentProfile?.studentId ?? r.user.email}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono font-black text-slate-800 dark:text-slate-200">
                    {r.currency} {r.amount.toFixed(2)}
                  </td>
                  <td className="max-w-[280px] px-4 py-3 text-slate-600 dark:text-slate-300">
                    <p className="line-clamp-2">{r.reason}</p>
                    {r.rejectedReason && (
                      <p className="mt-1 text-xs text-red-500">Note: {r.rejectedReason}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase ${
                        STATUS_STYLE[r.status] ?? 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {r.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      {canConfirm && (
                        <button
                          disabled={isPending}
                          onClick={() => run(() => staffConfirmRefund(r.id), 'Confirmed')}
                          className="flex items-center gap-1 rounded bg-blue-600 px-2 py-1 text-[10px] font-bold text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                          <CheckCircle2 className="h-3 w-3" /> Confirm
                        </button>
                      )}
                      {canApprove && (
                        <button
                          disabled={isPending}
                          onClick={() =>
                            run(() => approveAndProcessRefund(r.id), 'Refund processed')
                          }
                          className="flex items-center gap-1 rounded bg-emerald-600 px-2 py-1 text-[10px] font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                        >
                          <ShieldCheck className="h-3 w-3" /> Approve &amp; Pay
                        </button>
                      )}
                      {canReject && (
                        <button
                          disabled={isPending}
                          onClick={() => {
                            const reason = window.prompt('Reason for rejection?') ?? ''
                            run(() => rejectRefund(r.id, reason), 'Rejected')
                          }}
                          className="flex items-center gap-1 rounded bg-slate-200 px-2 py-1 text-[10px] font-bold text-slate-600 hover:bg-slate-300 disabled:opacity-50 dark:bg-slate-700 dark:text-slate-300"
                        >
                          <XCircle className="h-3 w-3" /> Reject
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
            {visible.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-400">
                  No refunds.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
