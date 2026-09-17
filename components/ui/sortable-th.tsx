'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export type SortOrder = 'asc' | 'desc'

export interface SortableColumn {
  /** Prisma field path, e.g. `"enrolledAt"`, `"user.profile.lastName"`. */
  key: string
  /** Visible header text. */
  label: string
  /** Toggle on click. Defaults to true. */
  sortable?: boolean
}

interface SortableThProps {
  sortKey: string
  label: string
  className?: string
  align?: 'left' | 'center' | 'right'
}

/**
 * Clickable table header that pushes `?sort=<key>&order=<asc|desc>` to the URL.
 * Cycles: none → asc → desc → none.
 *
 * For server-paginated tables: read `searchParams.sort` and `searchParams.order`
 * in the page component and translate them into Prisma `orderBy`.
 *
 * The current `query` param (and any other params) is preserved.
 */
export function SortableTh({ sortKey, label, className, align = 'left' }: SortableThProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const currentSort = searchParams.get('sort')
  const currentOrder = searchParams.get('order') as SortOrder | null
  const isActive = currentSort === sortKey
  const order: SortOrder | null = isActive ? (currentOrder === 'asc' || currentOrder === 'desc' ? currentOrder : 'asc') : null

  const handleClick = () => {
    const params = new URLSearchParams(searchParams.toString())
    // Tri-state: none → asc → desc → none. But to keep the URL clean,
    // start fresh on first click of a new column.
    let nextOrder: SortOrder
    if (!isActive) {
      nextOrder = 'asc'
    } else if (order === 'asc') {
      nextOrder = 'desc'
    } else {
      // was desc → clear sort
      nextOrder = 'asc'
    }

    params.set('sort', sortKey)
    params.set('order', nextOrder)
    // Reset to first page on sort change
    params.set('page', '1')
    router.push(`${pathname}?${params.toString()}`)
  }

  // Single-icon indicator: keeps the label baseline fixed whether the column
  // is active or not, so headers line up vertically with the data cells below.
  const Icon = !isActive ? ChevronsUpDown : order === 'asc' ? ChevronUp : ChevronDown

  return (
    <th
      scope="col"
      onClick={handleClick}
      className={cn(
        'cursor-pointer select-none px-6 py-3 text-[11px] font-black tracking-widest uppercase transition-colors hover:bg-slate-100/50 dark:hover:bg-slate-800/50',
        align === 'center' && 'text-center',
        align === 'right' && 'text-right',
        className
      )}
      aria-sort={isActive ? (order === 'asc' ? 'ascending' : 'descending') : 'none'}
    >
      <span
        className={cn(
          'inline-flex items-baseline gap-1.5',
          align === 'center' && 'justify-center',
          align === 'right' && 'justify-end'
        )}
      >
        <span className="whitespace-nowrap">{label}</span>
        <Icon
          aria-hidden="true"
          className={cn(
            'h-3.5 w-3.5 shrink-0 translate-y-0.5',
            isActive ? 'text-aerojet-blue' : 'text-slate-300 opacity-50 dark:text-slate-600'
          )}
          strokeWidth={3}
        />
      </span>
    </th>
  )
}

/**
 * Server-side helper for translating `?sort=&order=` into a Prisma `orderBy`.
 * Re-exported from `@/lib/utils/build-order-by` so it can be imported from
 * either location.
 */
export { buildOrderBy } from '@/lib/utils/build-order-by'
