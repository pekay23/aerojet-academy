'use client'

import React, { useState, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  FileText,
  ExternalLink,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

const CATEGORIES = [
  { id: 'ALL', label: 'All Resources' },
  { id: 'STUDENT_GUIDE', label: 'Student Guide' },
  { id: 'ACADEMIC', label: 'Academic' },
  { id: 'ADMINISTRATIVE', label: 'Administrative' },
  { id: 'EXAMINATION', label: 'Examination' },
  { id: 'INSTITUTIONAL', label: 'Institutional' },
]

interface Resource {
  id: string
  name: string
  type: string
  category: string
  url: string
  updatedAt: Date | string
  courseCode?: string
}

interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

interface ResourcesViewProps {
  initialResources: Resource[]
  meta?: PaginationMeta
  searchParams: {
    page?: string
    limit?: string
    sortBy?: string
    sortOrder?: string
    search?: string
    category?: string
  }
}

function SortIcon({ field, sortBy, sortOrder }: { field: string; sortBy: string; sortOrder: 'asc' | 'desc' }) {
  if (sortBy !== field) {
    return (
      <ArrowUpDown className="h-3.5 w-3.5 text-slate-400 opacity-40 transition-opacity group-hover:opacity-100" />
    )
  }
  return sortOrder === 'asc' ? (
    <ArrowUp className="h-3.5 w-3.5 text-blue-600" />
  ) : (
    <ArrowDown className="h-3.5 w-3.5 text-blue-600" />
  )
}

export default function ResourcesView({
  initialResources,
  meta,
  searchParams,
}: ResourcesViewProps) {
  const router = useRouter()
  const searchParamsHook = useSearchParams()

  const [localSearch, setLocalSearch] = useState(searchParams.search || '')
  const [localCategory, setLocalCategory] = useState(searchParams.category || 'ALL')
  const [sortBy, setSortBy] = useState(searchParams.sortBy || 'updatedAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(
    (searchParams.sortOrder as 'asc' | 'desc') || 'desc'
  )
  const [page, setPage] = useState(parseInt(searchParams.page || '1'))
  const [limit, setLimit] = useState(parseInt(searchParams.limit || '20'))

  const currentParams = useMemo(() => {
    const params = new URLSearchParams(searchParamsHook.toString())
    return params
  }, [searchParamsHook])

  const buildUrl = (updates: Record<string, string | number | undefined>) => {
    const params = new URLSearchParams(currentParams.toString())
    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === '') {
        params.delete(key)
      } else {
        params.set(key, String(value))
      }
    })
    return `?${params.toString()}`
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    router.push(buildUrl({ search: localSearch || undefined, page: 1 }))
  }

  const handleCategoryChange = (category: string) => {
    setLocalCategory(category)
    router.push(buildUrl({ category: category !== 'ALL' ? category : undefined, page: 1 }))
  }

  const handleSort = (field: string) => {
    if (sortBy === field) {
      const newOrder = sortOrder === 'asc' ? 'desc' : 'asc'
      setSortOrder(newOrder)
      router.push(buildUrl({ sortBy: field, sortOrder: newOrder }))
    } else {
      setSortBy(field)
      setSortOrder('asc')
      router.push(buildUrl({ sortBy: field, sortOrder: 'asc' }))
    }
  }

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || (meta && newPage > meta.totalPages)) return
    setPage(newPage)
    router.push(buildUrl({ page: newPage }))
  }

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit)
    router.push(buildUrl({ limit: newLimit, page: 1 }))
  }

  const getCategoryColor = (category: string) => {
    switch (category.toUpperCase()) {
      case 'STUDENT_GUIDE':
        return 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800'
      case 'ACADEMIC':
        return 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800'
      case 'ADMINISTRATIVE':
        return 'bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800'
      case 'EXAMINATION':
        return 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800'
      case 'INSTITUTIONAL':
        return 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
      default:
        return 'bg-slate-50 text-slate-600 border-slate-100 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
    }
  }

  const humanCategory = (category: string) =>
    category
      .toLowerCase()
      .split('_')
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join(' ')

  const getFileIcon = (type: string) => {
    switch (type.toUpperCase()) {
      case 'PDF':
        return <FileText className="h-4 w-4 text-rose-500" />
      case 'DOCX':
        return <FileText className="h-4 w-4 text-blue-500" />
      case 'ZIP':
        return <FileText className="h-4 w-4 text-amber-500" />
      case 'LINK':
        return <ExternalLink className="h-4 w-4 text-emerald-500" />
      default:
        return <FileText className="h-4 w-4 text-slate-500" />
    }
  }

  const totalPages = meta?.totalPages || 1
  const total = meta?.total || initialResources.length
  const currentPage = meta?.page || page
  const startItem = total === 0 ? 0 : (currentPage - 1) * limit + 1
  const endItem = Math.min(currentPage * limit, total)

  return (
    <div className="flex flex-col space-y-6">
      {/* Search, Filters, and Sort Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Search and Category Filter */}
        <div className="flex w-full flex-col gap-3 gap-4 sm:flex-row sm:items-center">
          <form onSubmit={handleSearchSubmit} className="relative max-w-lg flex-1">
            <Search className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-300" />
            <Input
              type="text"
              placeholder="Search by name, module code, or type..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="w-full rounded-2xl border border-slate-100 bg-white py-2.5 pr-4 pl-11 text-sm font-medium text-slate-900 transition-all outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-blue-900/40 dark:focus:ring-blue-900/20"
            />
          </form>

          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => {
              const isActive = localCategory === cat.id
              return (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryChange(cat.id)}
                  className={cn(
                    'flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-bold tracking-widest uppercase transition-all',
                    isActive
                      ? 'border-aerojet-sky bg-aerojet-sky text-white'
                      : 'border-slate-100 bg-white text-slate-500 hover:border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-slate-700'
                  )}
                >
                  {cat.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Page Size Selector */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-500 dark:text-slate-400">Show:</label>
          <select
            value={limit}
            onChange={(e) => handleLimitChange(parseInt(e.target.value))}
            className="rounded-xl border border-slate-100 bg-white px-3 py-2 text-sm font-medium text-slate-900 transition-all outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-blue-900/40 dark:focus:ring-blue-900/20"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/50 dark:bg-slate-800/50">
              <TableHead
                onClick={() => handleSort('name')}
                aria-label={`Sort by resource, ${sortOrder === 'asc' ? 'ascending' : 'descending'}`}
                aria-sort={sortBy === 'name' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
                className="group cursor-pointer text-[10px] font-bold tracking-wider uppercase select-none hover:text-slate-900 dark:hover:text-white"
              >
                <div className="flex items-center gap-1.5">
                  Resource
                  <SortIcon field="name" sortBy={sortBy} sortOrder={sortOrder} />
                </div>
              </TableHead>
              <TableHead
                onClick={() => handleSort('category')}
                aria-label={`Sort by category, ${sortOrder === 'asc' ? 'ascending' : 'descending'}`}
                aria-sort={sortBy === 'category' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
                className="group hidden cursor-pointer text-[10px] font-bold tracking-wider uppercase select-none hover:text-slate-900 md:table-cell dark:hover:text-white"
              >
                <div className="flex items-center gap-1.5">
                  Category
                  <SortIcon field="category" sortBy={sortBy} sortOrder={sortOrder} />
                </div>
              </TableHead>
              <TableHead
                onClick={() => handleSort('type')}
                aria-label={`Sort by type, ${sortOrder === 'asc' ? 'ascending' : 'descending'}`}
                aria-sort={sortBy === 'type' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
                className="group hidden cursor-pointer text-[10px] font-bold tracking-wider uppercase select-none hover:text-slate-900 lg:table-cell dark:hover:text-white"
              >
                <div className="flex items-center gap-1.5">
                  Type
                  <SortIcon field="type" sortBy={sortBy} sortOrder={sortOrder} />
                </div>
              </TableHead>
              <TableHead
                onClick={() => handleSort('courseCode')}
                aria-label={`Sort by module, ${sortOrder === 'asc' ? 'ascending' : 'descending'}`}
                aria-sort={sortBy === 'courseCode' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
                className="group hidden cursor-pointer text-[10px] font-bold tracking-wider uppercase select-none hover:text-slate-900 lg:table-cell dark:hover:text-white"
              >
                <div className="flex items-center gap-1.5">
                  Module
                  <SortIcon field="courseCode" sortBy={sortBy} sortOrder={sortOrder} />
                </div>
              </TableHead>
              <TableHead
                onClick={() => handleSort('updatedAt')}
                aria-label={`Sort by updated date, ${sortOrder === 'asc' ? 'ascending' : 'descending'}`}
                aria-sort={sortBy === 'updatedAt' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
                className="group hidden cursor-pointer text-[10px] font-bold tracking-wider uppercase select-none hover:text-slate-900 sm:table-cell dark:hover:text-white"
              >
                <div className="flex items-center gap-1.5">
                  Updated
                  <SortIcon field="updatedAt" sortBy={sortBy} sortOrder={sortOrder} />
                </div>
              </TableHead>
              <TableHead className="text-right text-[10px] font-bold tracking-wider uppercase">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialResources.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-slate-500">
                  No resources found.
                </TableCell>
              </TableRow>
            ) : (
              initialResources.map((resource) => (
                <TableRow
                  key={resource.id}
                  className="group transition-all duration-150 ease-out hover:bg-white/80 dark:hover:bg-slate-800/40"
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                        {getFileIcon(resource.type)}
                      </div>
                      <div className="min-w-0">
                        {resource.courseCode && (
                          <span className="text-aerojet-sky block truncate text-[10px] font-black uppercase">
                            {resource.courseCode}
                          </span>
                        )}
                        <div className="truncate font-bold text-slate-900 dark:text-slate-100">
                          {resource.name}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge
                      variant="outline"
                      className={cn(
                        'border-slate-200 px-2 py-0 text-[10px] font-bold tracking-widest uppercase dark:border-slate-700',
                        getCategoryColor(resource.category)
                      )}
                    >
                      {humanCategory(resource.category)}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      {resource.type}
                    </span>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
                      {resource.courseCode || '—'}
                    </span>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      {new Date(resource.updatedAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-slate-400 transition-all hover:bg-blue-500 hover:text-white dark:bg-slate-800 dark:hover:bg-blue-600"
                      title={resource.type === 'LINK' ? 'Open link' : 'Download file'}
                    >
                      {resource.type === 'LINK' ? (
                        <ExternalLink className="h-4 w-4" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                    </a>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-slate-500 dark:text-slate-400">
            Showing {startItem} to {endItem} of {total} resources
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="h-8 w-8 p-0"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (currentPage <= 3) {
                  pageNum = i + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = currentPage - 2 + i
                }
                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === currentPage ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handlePageChange(pageNum)}
                    className="h-8 w-8 min-w-0 p-0"
                  >
                    {pageNum}
                  </Button>
                )
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="h-8 w-8 p-0"
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
