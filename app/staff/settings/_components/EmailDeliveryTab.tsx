'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Mail,
  CheckCircle2,
  AlertOctagon,
  Clock,
  RefreshCw,
  Search,
} from 'lucide-react'

interface Delivery {
  id: string
  recipient: string
  subject: string
  status: 'SUCCESS' | 'FAILED' | 'RETRYING'
  messageId: string | null
  error: string | null
  attempts: number
  template: string | null
  userId: string | null
  createdAt: string
}

interface Page {
  data: Delivery[]
  meta: { page: number; limit: number; total: number; totalPages: number }
}

const STATUS_COLOUR: Record<Delivery['status'], string> = {
  SUCCESS: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  FAILED: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  RETRYING: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
}

const STATUS_ICON: Record<Delivery['status'], React.ComponentType<{ className?: string }>> = {
  SUCCESS: CheckCircle2,
  FAILED: AlertOctagon,
  RETRYING: Clock,
}

export default function EmailDeliveryTab() {
  const _router = useRouter()
  const [page, setPage] = useState<Page | null>(null)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<'all' | 'SUCCESS' | 'FAILED' | 'RETRYING'>('FAILED')
  const [search, setSearch] = useState('')
  const [pageNum, setPageNum] = useState(1)

  const reload = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        status,
        search,
        page: String(pageNum),
        limit: '25',
      })
      const res = await fetch(`/api/staff/settings/email-deliveries?${params}`, {
        cache: 'no-store',
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Failed to load')
      setPage(json)
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
  // eslint-disable-next-line react-hooks/set-state-in-effect
  // eslint-disable-next-line react-hooks/set-state-in-effect
    void reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, pageNum])

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPageNum(1)
    void reload()
  }

  const _failedCount = page?.data.filter((d) => d.status === 'FAILED').length ?? 0
  const total = page?.meta.total ?? 0

  return (
    <div className="space-y-6">
      <div>
        <h2 className="flex items-center gap-2 text-lg font-black text-slate-900 dark:text-slate-100">
          <Mail className="h-5 w-5 text-aerojet-blue" />
          Email delivery
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Every outbound email recorded by <code>lib/email/sender.ts</code>. Filter by status to
          spot deliverability problems (failures, retries, bounces from Resend).
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <button
          onClick={() => setStatus('FAILED')}
          className={`rounded-2xl border p-4 text-left transition ${
            status === 'FAILED'
              ? 'border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-900/20'
              : 'border-slate-100 bg-white hover:border-red-200 dark:border-slate-800 dark:bg-slate-900'
          }`}
        >
          <p className="text-xs font-bold tracking-widest text-slate-500 uppercase">Failed</p>
          <p className="mt-1 text-2xl font-black text-red-600">{status === 'FAILED' ? total : 'â€”'}</p>
        </button>
        <button
          onClick={() => setStatus('SUCCESS')}
          className={`rounded-2xl border p-4 text-left transition ${
            status === 'SUCCESS'
              ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-900/20'
              : 'border-slate-100 bg-white hover:border-emerald-200 dark:border-slate-800 dark:bg-slate-900'
          }`}
        >
          <p className="text-xs font-bold tracking-widest text-slate-500 uppercase">Delivered</p>
          <p className="mt-1 text-2xl font-black text-emerald-600">
            {status === 'SUCCESS' ? total : 'â€”'}
          </p>
        </button>
        <button
          onClick={() => setStatus('all')}
          className={`rounded-2xl border p-4 text-left transition ${
            status === 'all'
              ? 'border-aerojet-blue bg-aerojet-blue/5 dark:border-aerojet-blue'
              : 'border-slate-100 bg-white hover:border-aerojet-blue/30 dark:border-slate-800 dark:bg-slate-900'
          }`}
        >
          <p className="text-xs font-bold tracking-widest text-slate-500 uppercase">All recent</p>
          <p className="mt-1 text-2xl font-black text-aerojet-blue dark:text-white">
            {status === 'all' ? total : 'â€”'}
          </p>
        </button>
      </div>

      <form onSubmit={onSearch} className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search recipient, subject, error messageâ€¦"
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pr-3 pl-9 text-sm dark:border-slate-700 dark:bg-slate-800"
          />
        </div>
        <button
          type="submit"
          className="rounded-lg bg-aerojet-blue px-3 py-2 text-sm font-bold text-white hover:bg-aerojet-blue/90"
        >
          Apply
        </button>
        <button
          type="button"
          onClick={() => {
            setSearch('')
            setPageNum(1)
            void reload()
          }}
          className="flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </form>

      {loading && <p className="text-sm text-slate-400">Loadingâ€¦</p>}

      {!loading && page && (
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-[10px] font-black tracking-widest text-slate-400 uppercase dark:bg-slate-800">
              <tr>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Recipient</th>
                <th className="px-3 py-2">Subject</th>
                <th className="px-3 py-2">Template</th>
                <th className="px-3 py-2">Attempts</th>
                <th className="px-3 py-2">When</th>
              </tr>
            </thead>
            <tbody>
              {page.data.map((row) => {
                const Icon = STATUS_ICON[row.status]
                return (
                  <tr
                    key={row.id}
                    className="border-t border-slate-100 align-top dark:border-slate-800"
                  >
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black tracking-widest uppercase ${STATUS_COLOUR[row.status]}`}
                      >
                        <Icon className="h-3 w-3" /> {row.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-mono text-xs">{row.recipient}</td>
                    <td className="px-3 py-2">
                      <p className="text-sm">{row.subject}</p>
                      {row.error && (
                        <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                          {row.error}
                        </p>
                      )}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-500">{row.template ?? 'â€”'}</td>
                    <td className="px-3 py-2 font-mono text-xs">{row.attempts}</td>
                    <td className="px-3 py-2 text-xs text-slate-500">
                      {new Date(row.createdAt).toLocaleString()}
                    </td>
                  </tr>
                )
              })}
              {page.data.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-sm text-slate-400">
                    No deliveries match this filter. {status === 'FAILED' && 'â€” that\'s a good thing.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {page.meta.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 px-3 py-2 text-xs dark:border-slate-800">
              <span className="text-slate-400">
                Page {page.meta.page} of {page.meta.totalPages} Â· {page.meta.total} total
              </span>
              <div className="flex gap-1">
                <button
                  disabled={pageNum <= 1}
                  onClick={() => setPageNum((p) => Math.max(1, p - 1))}
                  className="rounded-md bg-slate-100 px-2 py-1 text-slate-600 disabled:opacity-30 dark:bg-slate-800 dark:text-slate-300"
                >
                  â† Prev
                </button>
                <button
                  disabled={pageNum >= page.meta.totalPages}
                  onClick={() => setPageNum((p) => p + 1)}
                  className="rounded-md bg-slate-100 px-2 py-1 text-slate-600 disabled:opacity-30 dark:bg-slate-800 dark:text-slate-300"
                >
                  Next â†’
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
