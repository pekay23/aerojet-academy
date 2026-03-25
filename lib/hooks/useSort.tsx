'use client'

import { useState, useMemo } from 'react'
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export type SortOrder = 'asc' | 'desc' | null

export interface SortConfig {
  key: string
  order: SortOrder
}

export function useSort<T>(items: T[], initialSort?: SortConfig) {
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(initialSort || null)

  const sortedItems = useMemo(() => {
    if (!sortConfig || !sortConfig.order) return items

    return [...items].sort((a: any, b: any) => {
      let aValue = a[sortConfig.key]
      let bValue = b[sortConfig.key]

      // Handle nulls
      if (aValue === null || aValue === undefined) return 1
      if (bValue === null || bValue === undefined) return -1

      // Handle dates
      if (aValue instanceof Date && bValue instanceof Date) {
        return sortConfig.order === 'asc'
          ? aValue.getTime() - bValue.getTime()
          : bValue.getTime() - aValue.getTime()
      }

      // Handle strings
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.order === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      }

      // Handle numbers
      return sortConfig.order === 'asc' ? aValue - bValue : bValue - aValue
    })
  }, [items, sortConfig])

  const requestSort = (key: string) => {
    let order: SortOrder = 'asc'
    if (sortConfig && sortConfig.key === key) {
      if (sortConfig.order === 'asc') order = 'desc'
      else if (sortConfig.order === 'desc') order = null
      else order = 'asc'
    }
    setSortConfig(order ? { key, order } : null)
  }

  return { items: sortedItems, requestSort, sortConfig }
}

interface SortHeaderProps {
  label: string
  sortKey: string
  currentSort: SortConfig | null
  onSort: (key: string) => void
  align?: 'left' | 'center' | 'right'
  className?: string
}

export function SortHeader({
  label,
  sortKey,
  currentSort,
  onSort,
  align = 'left',
  className,
}: SortHeaderProps) {
  const isSorted = currentSort?.key === sortKey
  const order = isSorted ? currentSort?.order : null

  return (
    <th
      scope="col"
      className={cn(
        'cursor-pointer px-6 py-4 transition-colors select-none hover:bg-slate-100/50 dark:hover:bg-slate-800/50',
        align === 'center' && 'text-center',
        align === 'right' && 'text-right',
        className
      )}
      onClick={() => onSort(sortKey)}
    >
      <div
        className={cn(
          'flex items-center gap-1.5',
          align === 'center' && 'justify-center',
          align === 'right' && 'justify-end'
        )}
      >
        <span>{label}</span>
        <div className="flex flex-col text-slate-300">
          {order === 'asc' ? (
            <ChevronUp className="h-3 w-3 text-aerojet-blue dark:text-blue-400" />
          ) : order === 'desc' ? (
            <ChevronDown className="h-3 w-3 text-aerojet-blue dark:text-blue-400" />
          ) : (
            <ChevronsUpDown className="h-3 w-3 opacity-30" />
          )}
        </div>
      </div>
    </th>
  )
}
