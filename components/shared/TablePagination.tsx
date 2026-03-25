'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'

const PER_PAGE_OPTIONS = [10, 25, 50, 100]

interface TablePaginationProps {
  page: number
  perPage: number
  total: number
  onPageChange: (page: number) => void
  onPerPageChange: (perPage: number) => void
}

export default function TablePagination({
  page,
  perPage,
  total,
  onPageChange,
  onPerPageChange,
}: TablePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / perPage))
  const start = total === 0 ? 0 : (page - 1) * perPage + 1
  const end = Math.min(page * perPage, total)

  return (
    <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 dark:border-slate-800">
      {/* Left: entries selector */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500 dark:text-slate-400">Show</span>
        <select
          value={perPage}
          onChange={(e) => {
            onPerPageChange(Number(e.target.value))
            onPageChange(1)
          }}
          aria-label="Rows per page"
          className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-slate-600 outline-none transition-colors focus:ring-2 focus:ring-aerojet-sky dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
        >
          {PER_PAGE_OPTIONS.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        <span className="text-xs text-slate-500 dark:text-slate-400">entries</span>
      </div>

      {/* Center: page info */}
      <span className="text-xs text-slate-500 dark:text-slate-400">
        {total === 0 ? 'No results' : `${start}–${end} of ${total.toLocaleString()}`}
      </span>

      {/* Right: prev/next */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-transparent dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        <span className="min-w-12 text-center text-xs font-bold text-slate-600 dark:text-slate-300">
          {page} / {totalPages}
        </span>
        <button
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-transparent dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
          aria-label="Next page"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
