'use client'

import { ChevronUp, ChevronDown } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from './EmptyState'
import { cn } from '@/lib/utils'

export type SortOrder = 'asc' | 'desc' | null

export interface Column<T> {
  key: string
  header: string
  cell?: (row: T) => React.ReactNode
  className?: string
  headerClassName?: string
  sortable?: boolean
}

interface PaginationProps {
  page: number
  perPage: number
  total: number
  onPageChange: (page: number) => void
  onPerPageChange: (perPage: number) => void
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  loading?: boolean
  emptyMessage?: string
  onRowClick?: (row: T) => void
  pagination?: PaginationProps
  rowKey?: (row: T) => string | number
  selectedIds?: string[]
  onSelectionChange?: (ids: string[]) => void
  sortKey?: string
  sortOrder?: SortOrder
  onSort?: (key: string) => void
}

export function DataTable<T>({
  columns,
  data,
  loading,
  emptyMessage = 'No data found',
  onRowClick,
  pagination,
  rowKey,
  selectedIds = [],
  onSelectionChange,
  sortKey,
  sortOrder,
  onSort,
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    )
  }

  if (!data.length) {
    return <EmptyState title={emptyMessage} />
  }

  const getRowId = rowKey
    ? rowKey
    : (row: T, index: number) =>
        typeof row === 'object' && row !== null && 'id' in row
          ? String((row as Record<string, unknown>).id)
          : String(index)

  const allSelected = selectedIds.length > 0 && data.every((row) => String(getRowId(row, 0)) === '')

  const toggleSelectAll = () => {
    if (onSelectionChange) {
      const allIds = data.map((row, i) => String(getRowId(row, i)))
      const isAll = allIds.every((id) => selectedIds.includes(id))
      onSelectionChange(isAll ? [] : allIds)
    }
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {onSelectionChange && (
              <TableHead className="w-12">
                <button
                  onClick={toggleSelectAll}
                  className="hover:text-aerojet-blue text-slate-400 transition-colors"
                  aria-label={allSelected ? 'Deselect all' : 'Select all'}
                >
                  <input
                    type="checkbox"
                    checked={allSelected}
                    readOnly
                    className="text-aerojet-blue h-4 w-4 cursor-pointer rounded border-slate-300"
                  />
                </button>
              </TableHead>
            )}
            {columns.map((col) => {
              const isSorted = col.sortable && sortKey === col.key
              return (
                <TableHead
                  key={col.key}
                  className={cn(col.className, col.headerClassName, 'select-none')}
                >
                  {col.sortable ? (
                    <button
                      onClick={() => onSort?.(col.key)}
                      className="flex items-center gap-1 font-black uppercase"
                    >
                      {col.header}
                      <span className="flex flex-col text-slate-300">
                        {isSorted ? (
                          sortOrder === 'asc' ? (
                            <ChevronUp className="text-aerojet-blue h-3 w-3" />
                          ) : (
                            <ChevronDown className="text-aerojet-blue h-3 w-3" />
                          )
                        ) : (
                          <ChevronUp className="h-3 w-3 opacity-30" />
                        )}
                      </span>
                    </button>
                  ) : (
                    col.header
                  )}
                </TableHead>
              )
            })}
            {onRowClick && <th className="w-12" />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, i) => {
            const rowId = String(getRowId(row, i))
            const isSelected = selectedIds.includes(rowId)
            return (
              <TableRow
                key={rowId}
                className={cn(
                  'group',
                  onRowClick ? 'cursor-pointer' : '',
                  isSelected ? 'bg-aerojet-blue/5' : ''
                )}
                onClick={() => onRowClick?.(row)}
              >
                {onSelectionChange && (
                  <TableCell className="w-12" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => {
                        if (onSelectionChange) {
                          const newIds = isSelected
                            ? selectedIds.filter((id) => id !== rowId)
                            : [...selectedIds, rowId]
                          onSelectionChange(newIds)
                        }
                      }}
                      className="hover:text-aerojet-blue text-slate-300 transition-colors"
                      aria-label={isSelected ? `Deselect ${rowId}` : `Select ${rowId}`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        readOnly
                        className="text-aerojet-blue h-4 w-4 cursor-pointer rounded border-slate-300"
                      />
                    </button>
                  </TableCell>
                )}
                {columns.map((col) => (
                  <TableCell key={col.key} className={col.className}>
                    {col.cell ? (
                      col.cell(row)
                    ) : (
                      <span className="block max-w-50 truncate">
                        {String((row as Record<string, unknown>)[col.key] ?? '—')}
                      </span>
                    )}
                  </TableCell>
                ))}
              </TableRow>
            )
          })}
        </TableBody>
      </Table>

      {pagination && pagination.total > 0 && (
        <div className="border-t border-slate-100 px-4 py-3 dark:border-slate-800">
          <div className="flex items-center justify-between text-sm">
            <div className="text-slate-500 dark:text-slate-400">
              Showing {Math.min((pagination.page - 1) * pagination.perPage + 1, pagination.total)}–
              {Math.min(pagination.page * pagination.perPage, pagination.total)} of{' '}
              {pagination.total}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => pagination.onPageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="rounded border border-slate-200 px-2 py-1 text-xs font-bold disabled:opacity-50 dark:border-slate-700"
              >
                Prev
              </button>
              {Array.from({
                length: Math.min(5, Math.ceil(pagination.total / pagination.perPage)),
              }).map((_, i) => {
                const pageNum = Math.max(1, pagination.page - 2) + i
                return (
                  <button
                    key={pageNum}
                    onClick={() => pagination.onPageChange(pageNum)}
                    className={cn(
                      'rounded border border-slate-200 px-2 py-1 text-xs font-bold',
                      pageNum === pagination.page
                        ? 'bg-aerojet-blue text-white'
                        : 'hover:bg-slate-50 dark:border-slate-700'
                    )}
                  >
                    {pageNum}
                  </button>
                )
              })}
              <button
                onClick={() => pagination.onPageChange(pagination.page + 1)}
                disabled={pagination.page >= Math.ceil(pagination.total / pagination.perPage)}
                className="rounded border border-slate-200 px-2 py-1 text-xs font-bold disabled:opacity-50 dark:border-slate-700"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
