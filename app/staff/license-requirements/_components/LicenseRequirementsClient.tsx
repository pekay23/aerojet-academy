'use client'

import { useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Shield, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { compareNatural } from '@/lib/utils/natural-sort'

interface Course {
  id: string
  code: string
  name: string
}

interface LicenseCategory {
  id: string
  code: string
  name: string
  requirements: { id: string; courseId: string; course: Course }[]
}

type SortOrder = 'asc' | 'desc'

export default function LicenseRequirementsClient({
  licenseCategories,
  courses,
  defaultSortBy = 'code',
  defaultSortOrder = 'asc',
}: {
  licenseCategories: LicenseCategory[]
  courses: Course[]
  defaultSortBy?: string
  defaultSortOrder?: SortOrder
}) {
  const router = useRouter()
  const [toggling, setToggling] = useState<string | null>(null)

  // Sorting state
  const [sortBy, setSortBy] = useState<string>(defaultSortBy)
  const [sortOrder, setSortOrder] = useState<SortOrder>(defaultSortOrder)

  // Build a set of "licenseCategoryId:courseId" for quick lookup
  const requiredSet = useMemo(() => {
    const set = new Set<string>()
    for (const lc of licenseCategories) {
      for (const req of lc.requirements) {
        set.add(`${lc.id}:${req.courseId}`)
      }
    }
    return set
  }, [licenseCategories])

  // Sort courses
  const sortedCourses = useMemo(() => {
    return [...courses].sort((a, b) => {
      let comparison = 0

      if (sortBy === 'code') {
        comparison = compareNatural(a.code, b.code)
      } else {
        // Sort by license category requirement (true/false)
        const aRequired = requiredSet.has(`${sortBy}:${a.id}`) ? 1 : 0
        const bRequired = requiredSet.has(`${sortBy}:${b.id}`) ? 1 : 0

        comparison = aRequired - bRequired

        // Secondary sort by code if requirements are equal
        if (comparison === 0) {
          comparison = compareNatural(a.code, b.code)
        }
      }

      return sortOrder === 'asc' ? comparison : -comparison
    })
  }, [courses, sortBy, sortOrder, requiredSet])

  const handleSort = (column: string) => {
    if (sortBy === column) {
      // Toggle order if clicking the same column
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      // Set new column and default to ascending (except for requirements which default to desc)
      setSortBy(column)
      setSortOrder(column === 'code' ? 'asc' : 'desc')
    }
  }

  const SortIndicator = ({ column }: { column: string }) => {
    if (sortBy !== column) {
      return (
        <ArrowUpDown className="ml-1 inline-block h-3 w-3 opacity-30 transition-opacity group-hover:opacity-100" />
      )
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="ml-1 inline-block h-3 w-3 text-blue-600 dark:text-blue-400" />
    ) : (
      <ArrowDown className="ml-1 inline-block h-3 w-3 text-blue-600 dark:text-blue-400" />
    )
  }

  const handleToggle = useCallback(
    async (licenseCategoryId: string, courseId: string, isCurrentlyRequired: boolean) => {
      const key = `${licenseCategoryId}:${courseId}`
      setToggling(key)
      try {
        const res = await fetch('/api/staff/license-requirements', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            licenseCategoryId,
            courseId,
            action: isCurrentlyRequired ? 'remove' : 'add',
          }),
        })
        if (!res.ok) {
          const data = await res.json()
          toast.error(data.error || 'Failed to update')
        }
        router.refresh()
      } catch {
        toast.error('Network error')
      } finally {
        setToggling(null)
      }
    },
    [router]
  )

  return (
    <div className="mx-auto max-w-[1800px]">
      <div className="mb-6">
        <h1 className="text-aerojet-blue flex items-center gap-2 text-2xl font-black tracking-tight dark:text-white">
          <Shield className="h-6 w-6 text-blue-600" />
          License Module Requirements
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Configure which EASA modules are required for each license category. Click cells to
          toggle.
        </p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200/60 dark:border-slate-700/60">
              <th
                className="group sticky left-0 z-10 cursor-pointer bg-white px-4 py-3 text-left text-xs font-black tracking-widest text-slate-400 uppercase transition-all duration-150 ease-out hover:bg-white hover:text-slate-600 hover:shadow-sm dark:bg-slate-900 dark:hover:bg-slate-800/60"
                onClick={() => handleSort('code')}
              >
                {/* eslint-disable-next-line react-hooks/static-components */}
                Module <SortIndicator column="code" />
              </th>
              {licenseCategories.map((lc) => (
                <th
                  key={lc.id}
                  className="group cursor-pointer px-3 py-3 text-center text-xs font-black tracking-wider text-slate-500 transition-all duration-150 ease-out hover:bg-white/80 dark:hover:bg-slate-800/60"
                  onClick={() => handleSort(lc.id)}
                >
                  {}
                  {lc.code} <SortIndicator column={lc.id} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedCourses.map((course) => (
              <tr
                key={course.id}
                className="border-b border-slate-200/30 transition-all duration-150 ease-out hover:bg-white/80 dark:border-slate-700/30 dark:hover:bg-slate-800/40"
              >
                <td className="sticky left-0 z-10 bg-white px-4 py-2 dark:bg-slate-900">
                  <span className="mr-2 font-mono text-xs font-bold text-slate-400">
                    {course.code}
                  </span>
                  <span className="text-slate-700 dark:text-slate-300">{course.name}</span>
                </td>
                {licenseCategories.map((lc) => {
                  const key = `${lc.id}:${course.id}`
                  const isRequired = requiredSet.has(key)
                  const isLoading = toggling === key

                  return (
                    <td key={lc.id} className="px-3 py-2 text-center">
                      <button
                        onClick={() => handleToggle(lc.id, course.id, isRequired)}
                        disabled={isLoading}
                        className={`inline-flex h-7 w-7 items-center justify-center rounded-md border transition-all ${
                          isRequired
                            ? 'border-blue-300 bg-blue-100 text-blue-700 hover:bg-blue-200 dark:border-blue-700 dark:bg-blue-900/40 dark:text-blue-400'
                            : 'border-slate-200 bg-white text-slate-300 hover:border-slate-300 hover:shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-600 dark:hover:border-slate-600'
                        }`}
                      >
                        {isLoading ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : isRequired ? (
                          <span className="text-xs font-black">R</span>
                        ) : (
                          <span className="text-xs">&ndash;</span>
                        )}
                      </button>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded border border-blue-300 bg-blue-100 text-[10px] font-black text-blue-700">
            R
          </span>
          Required
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded border border-slate-200 bg-white text-[10px] text-slate-300">
            &ndash;
          </span>
          Not required
        </div>
      </div>
    </div>
  )
}
