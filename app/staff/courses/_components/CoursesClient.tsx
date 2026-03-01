'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Plus,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Pin,
  PinOff,
  Search,
  SlidersHorizontal,
  Layers,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react'
import CourseActionsMenu from '../../_components/CourseActionsMenu'

type Course = {
  id: string
  code: string
  name: string
  price: string
  currency: string
  isActive: boolean
  moduleType: string | null
  duration: number | null
}

type Category = {
  id: string
  name: string
  description: string | null
  courses: Course[]
  _count: { courses: number }
}

interface Props {
  categories: Category[]
}

// EASA category IDs/names that should be pinned on top by default.
// We detect EASA by checking if the name contains "EASA" or "MODULE".
function isEasaCategory(cat: Category) {
  const n = cat.name.toUpperCase()
  return n.includes('EASA') || n.includes('MODULE')
}

export default function CoursesClient({ categories }: Props) {
  // Which category IDs are manually pinned on top
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(() => {
    const easaIds = categories.filter(isEasaCategory).map((c) => c.id)
    return new Set(easaIds)
  })

  // Which categories are collapsed
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

  // Filters
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  // Sorting
  const [sortKey, setSortKey] = useState<'code' | 'name' | 'price' | 'isActive'>('code')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  const toggleSort = (key: 'code' | 'name' | 'price' | 'isActive') => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDirection('asc')
    }
  }

  const togglePin = (id: string) => {
    setPinnedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleCollapse = (id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Build the sorted category order: pinned first, then rest
  const orderedCategories = useMemo(() => {
    const pinned = categories.filter((c) => pinnedIds.has(c.id))
    const rest = categories.filter((c) => !pinnedIds.has(c.id))
    return [...pinned, ...rest]
  }, [categories, pinnedIds])

  // Filter and sort courses inside each category
  const filteredCategories = useMemo(() => {
    return orderedCategories
      .map((cat) => {
        const filtered = cat.courses.filter((course) => {
          const matchSearch =
            !search ||
            course.name.toLowerCase().includes(search.toLowerCase()) ||
            course.code.toLowerCase().includes(search.toLowerCase())
          const matchStatus =
            activeFilter === 'all' ||
            (activeFilter === 'active' && course.isActive) ||
            (activeFilter === 'inactive' && !course.isActive)
          return matchSearch && matchStatus
        })

        // Sort the filtered courses
        const sorted = [...filtered].sort((a, b) => {
          let valA: any = a[sortKey]
          let valB: any = b[sortKey]

          if (sortKey === 'price') {
            valA = Number(a.price)
            valB = Number(b.price)
          }

          if (valA < valB) return sortDirection === 'asc' ? -1 : 1
          if (valA > valB) return sortDirection === 'asc' ? 1 : -1
          return 0
        })

        return { ...cat, courses: sorted }
      })
      .filter((cat) => categoryFilter === 'all' || cat.id === categoryFilter)
  }, [orderedCategories, search, activeFilter, categoryFilter, sortKey, sortDirection])

  const totalCourses = categories.reduce((s, c) => s + c._count.courses, 0)
  const pinnedCategories = categories.filter((c) => pinnedIds.has(c.id))

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-[#002a5c] dark:text-white">
            Courses
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {categories.length} categories · {totalCourses} courses
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/staff/courses/categories"
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-[#002a5c] transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          >
            <Layers className="h-4 w-4" />
            Manage Categories
          </Link>
          <Link
            href="/staff/courses/create"
            className="flex items-center gap-2 rounded-xl bg-[#002a5c] px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#002a5c]/90"
          >
            <Plus className="h-4 w-4" />
            Create Course
          </Link>
        </div>
      </div>

      {/* ── Filter Bar ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center dark:border-slate-800 dark:bg-slate-900">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by code or name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pr-4 pl-9 text-sm font-medium text-slate-700 placeholder-slate-400 outline-none focus:border-[#4c9ded] focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          />
        </div>

        {/* Category dropdown */}
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-slate-400" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 outline-none focus:border-[#4c9ded] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="all">All Categories</option>
            {orderedCategories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name.replace(/_/g, ' ')} ({cat._count.courses})
              </option>
            ))}
          </select>
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-1 rounded-xl border border-slate-100 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-800">
          {(['all', 'active', 'inactive'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`rounded-lg px-3 py-1 text-xs font-bold capitalize transition-all ${
                activeFilter === f
                  ? 'bg-[#002a5c] text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* ── Pinned chips summary ────────────────────────────────────────────── */}
      {pinnedCategories.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <Pin className="h-3.5 w-3.5 text-[#4c9ded]" />
          <span className="text-xs font-bold tracking-widest text-slate-400 uppercase">
            Pinned:
          </span>
          {pinnedCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => togglePin(cat.id)}
              className="group flex items-center gap-1.5 rounded-full bg-[#002a5c]/8 px-3 py-1 text-xs font-bold text-[#002a5c] transition-all hover:bg-red-50 hover:text-red-600 dark:bg-blue-900/20 dark:text-blue-300"
            >
              {cat.name.replace(/_/g, ' ')}
              <PinOff className="h-3 w-3 opacity-0 group-hover:opacity-100" />
            </button>
          ))}
        </div>
      )}

      {/* ── Category Accordions ─────────────────────────────────────────────── */}
      <div className="space-y-4">
        {filteredCategories.map((cat) => {
          const isPinned = pinnedIds.has(cat.id)
          const isCollapsed = collapsed.has(cat.id)
          const isEasa = isEasaCategory(cat)

          return (
            <div
              key={cat.id}
              className={`overflow-hidden rounded-2xl border shadow-sm transition-all ${
                isPinned
                  ? 'border-[#4c9ded]/40 dark:border-[#4c9ded]/20'
                  : 'border-slate-100 dark:border-slate-800'
              } bg-white dark:bg-slate-900`}
            >
              {/* Category header bar */}
              <div
                className={`flex items-center gap-3 px-5 py-4 ${
                  isPinned
                    ? 'bg-linear-to-r from-[#002a5c]/5 to-[#4c9ded]/5 dark:from-blue-900/20 dark:to-blue-800/10'
                    : 'bg-slate-50 dark:bg-slate-800/50'
                } border-b border-slate-100 dark:border-slate-800`}
              >
                {/* Collapse toggle */}
                <button
                  onClick={() => toggleCollapse(cat.id)}
                  className="shrink-0 rounded-lg p-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                  title={isCollapsed ? 'Expand' : 'Collapse'}
                >
                  {isCollapsed ? (
                    <ChevronRight className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>

                {/* Name + badges */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => toggleCollapse(cat.id)}
                      className="text-left text-base font-black text-[#002a5c] hover:text-[#4c9ded] dark:text-white"
                    >
                      {cat.name.replace(/_/g, ' ')}
                    </button>

                    {isEasa && (
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-black tracking-widest text-[#002a5c] uppercase dark:bg-blue-900/30 dark:text-blue-300">
                        EASA
                      </span>
                    )}
                    {isPinned && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black tracking-widest text-amber-700 uppercase dark:bg-amber-900/30 dark:text-amber-300">
                        Pinned
                      </span>
                    )}
                    <span className="text-xs text-slate-400">
                      ({cat.courses.length}
                      {cat.courses.length !== cat._count.courses
                        ? ` of ${cat._count.courses}`
                        : ''}{' '}
                      {cat._count.courses === 1 ? 'course' : 'courses'})
                    </span>
                  </div>
                  {cat.description && (
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      {cat.description}
                    </p>
                  )}
                </div>

                {/* Pin toggle */}
                <button
                  onClick={() => togglePin(cat.id)}
                  title={isPinned ? 'Unpin category' : 'Pin to top'}
                  className={`shrink-0 rounded-lg p-1.5 transition-colors ${
                    isPinned
                      ? 'text-[#4c9ded] hover:text-slate-400'
                      : 'text-slate-300 hover:text-[#4c9ded] dark:text-slate-600'
                  }`}
                >
                  {isPinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                </button>
              </div>

              {/* Courses table — hidden when collapsed */}
              {!isCollapsed && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase dark:bg-slate-800/20 dark:text-slate-500">
                      <tr>
                        <th
                          className="cursor-pointer px-6 py-3 select-none hover:text-slate-600 dark:hover:text-slate-300"
                          onClick={() => toggleSort('code')}
                        >
                          <div className="flex items-center gap-1.5">
                            Code
                            {sortKey === 'code' ? (
                              sortDirection === 'asc' ? (
                                <ArrowUp className="h-3 w-3" />
                              ) : (
                                <ArrowDown className="h-3 w-3" />
                              )
                            ) : (
                              <ArrowUpDown className="h-3 w-3 opacity-30" />
                            )}
                          </div>
                        </th>
                        <th
                          className="cursor-pointer px-6 py-3 select-none hover:text-slate-600 dark:hover:text-slate-300"
                          onClick={() => toggleSort('name')}
                        >
                          <div className="flex items-center gap-1.5">
                            Course Name
                            {sortKey === 'name' ? (
                              sortDirection === 'asc' ? (
                                <ArrowUp className="h-3 w-3" />
                              ) : (
                                <ArrowDown className="h-3 w-3" />
                              )
                            ) : (
                              <ArrowUpDown className="h-3 w-3 opacity-30" />
                            )}
                          </div>
                        </th>
                        <th className="px-6 py-3">License / Pathway</th>
                        <th
                          className="cursor-pointer px-6 py-3 select-none hover:text-slate-600 dark:hover:text-slate-300"
                          onClick={() => toggleSort('isActive')}
                        >
                          <div className="flex items-center gap-1.5">
                            Status
                            {sortKey === 'isActive' ? (
                              sortDirection === 'asc' ? (
                                <ArrowUp className="h-3 w-3" />
                              ) : (
                                <ArrowDown className="h-3 w-3" />
                              )
                            ) : (
                              <ArrowUpDown className="h-3 w-3 opacity-30" />
                            )}
                          </div>
                        </th>
                        <th
                          className="cursor-pointer px-6 py-3 text-right select-none hover:text-slate-600 dark:hover:text-slate-300"
                          onClick={() => toggleSort('price')}
                        >
                          <div className="flex items-center justify-end gap-1.5">
                            Investment
                            {sortKey === 'price' ? (
                              sortDirection === 'asc' ? (
                                <ArrowUp className="h-3 w-3" />
                              ) : (
                                <ArrowDown className="h-3 w-3" />
                              )
                            ) : (
                              <ArrowUpDown className="h-3 w-3 opacity-30" />
                            )}
                          </div>
                        </th>
                        <th className="px-6 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {cat.courses.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-6 py-8 text-center text-sm text-slate-400 italic"
                          >
                            {search || activeFilter !== 'all'
                              ? 'No courses match your filters.'
                              : 'No courses in this category.'}
                          </td>
                        </tr>
                      ) : (
                        cat.courses.map((course) => (
                          <tr
                            key={course.id}
                            className="group transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                          >
                            {/* Code */}
                            <td className="px-6 py-4 font-mono text-sm font-bold text-slate-500 dark:text-slate-400">
                              {course.code}
                            </td>

                            {/* Name */}
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                                  <BookOpen className="h-4 w-4" />
                                </div>
                                <Link
                                  href={`/staff/courses/${course.id}`}
                                  className="font-bold text-slate-900 hover:text-[#4c9ded] dark:text-slate-100"
                                >
                                  {course.name}
                                </Link>
                              </div>
                            </td>

                            {/* License / Pathway */}
                            <td className="px-6 py-4">
                              <div className="flex flex-wrap gap-1.5">
                                {course.moduleType && (
                                  <span className="rounded-md bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-700 ring-1 ring-amber-600/20 ring-inset dark:bg-amber-900/20 dark:text-amber-400">
                                    {course.moduleType.replace(/_/g, ' ')}
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Status */}
                            <td className="px-6 py-4">
                              <span
                                className={`rounded-full px-2.5 py-1 text-[10px] font-black tracking-wide uppercase ${
                                  course.isActive
                                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                                    : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                                }`}
                              >
                                {course.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </td>

                            {/* Investment / Price */}
                            <td className="px-6 py-4 text-right font-bold text-slate-700 dark:text-slate-300">
                              {course.currency} {Number(course.price).toLocaleString()}
                            </td>

                            {/* Actions */}
                            <td className="px-6 py-4 text-right">
                              <CourseActionsMenu courseId={course.id} courseName={course.name} />
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )
        })}

        {filteredCategories.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-200 p-12 text-center text-slate-400 dark:border-slate-800">
            No categories match the current filter.
          </div>
        )}
      </div>
    </div>
  )
}
