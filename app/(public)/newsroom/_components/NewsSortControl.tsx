'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { ArrowUpDown } from 'lucide-react'

type SortOrder = 'newest' | 'oldest'

export default function NewsSortControl({ current }: { current: SortOrder }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('sort', e.target.value)
    params.delete('page')
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="mb-8 flex items-center justify-end gap-3">
      <label
        htmlFor="news-sort"
        className="text-aerojet-blue flex items-center gap-2 text-sm font-bold tracking-wider uppercase"
      >
        <ArrowUpDown className="text-aerojet-sky h-4 w-4" aria-hidden="true" />
        Sort by
      </label>
      <select
        id="news-sort"
        value={current}
        onChange={handleChange}
        className="hover:border-aerojet-sky focus:border-aerojet-sky focus:ring-aerojet-sky/30 cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-colors outline-none focus:ring-2"
      >
        <option value="newest">Newest first</option>
        <option value="oldest">Oldest first</option>
      </select>
    </div>
  )
}
