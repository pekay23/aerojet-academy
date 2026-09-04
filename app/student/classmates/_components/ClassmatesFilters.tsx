'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useState, useTransition } from 'react'
import { Search, Users, BookOpen, Calendar, Route, GraduationCap } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type FilterType = 'batch' | 'classmates' | 'year' | 'semester' | 'pathway' | 'class'

interface ClassmatesFiltersProps {
  currentFilter: string
  currentQuery: string
  currentYear?: string
  currentSemester?: string
  currentPathway?: string
  currentClassId?: string
  academicYears: { id: string; name: string }[]
  semesters: { id: string; name: string }[]
  pathways: { id: string; name: string }[]
  classes: { id: string; label: string }[]
}

const FILTER_TABS: { key: FilterType; label: string; icon: typeof Users }[] = [
  { key: 'batch', label: 'All Batch-mates', icon: Users },
  { key: 'classmates', label: 'My Classes', icon: BookOpen },
  { key: 'year', label: 'By Year', icon: Calendar },
  { key: 'semester', label: 'By Semester', icon: Calendar },
  { key: 'pathway', label: 'By Pathway', icon: Route },
  { key: 'class', label: 'By Class', icon: GraduationCap },
]

export default function ClassmatesFilters({
  currentFilter,
  currentQuery,
  currentYear,
  currentSemester,
  currentPathway,
  currentClassId,
  academicYears,
  semesters,
  pathways,
  classes,
}: ClassmatesFiltersProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [query, setQuery] = useState(currentQuery)

  const buildUrl = useCallback(
    (params: Record<string, string | undefined>) => {
      const sp = new URLSearchParams()
      for (const [k, v] of Object.entries(params)) {
        if (v) sp.set(k, v)
      }
      return `/student/classmates?${sp.toString()}`
    },
    []
  )

  function handleFilterChange(filter: FilterType) {
    startTransition(() => {
      router.push(buildUrl({ filter, q: query || undefined }), { scroll: false })
    })
  }

  function handleSubFilterChange(key: string, value: string) {
    startTransition(() => {
      router.push(
        buildUrl({ filter: currentFilter, q: query || undefined, [key]: value }),
        { scroll: false }
      )
    })
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    startTransition(() => {
      const params: Record<string, string | undefined> = {
        filter: currentFilter,
        q: query || undefined,
      }
      if (currentYear) params.year = currentYear
      if (currentSemester) params.semester = currentSemester
      if (currentPathway) params.pathway = currentPathway
      if (currentClassId) params.classId = currentClassId
      router.push(buildUrl(params), { scroll: false })
    })
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <form onSubmit={handleSearch} className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          placeholder="Search by name or email..."
          className="pl-10 rounded-2xl border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </form>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {FILTER_TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = currentFilter === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => handleFilterChange(tab.key)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold transition-all',
                isActive
                  ? 'bg-blue-800 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Sub-filters */}
      {currentFilter === 'year' && academicYears.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {academicYears.map((ay) => (
            <Badge
              key={ay.id}
              variant={currentYear === ay.id ? 'default' : 'outline'}
              className="cursor-pointer px-3 py-1 text-xs font-bold"
              onClick={() => handleSubFilterChange('year', ay.id)}
            >
              {ay.name}
            </Badge>
          ))}
        </div>
      )}

      {currentFilter === 'semester' && semesters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {semesters.map((sem) => (
            <Badge
              key={sem.id}
              variant={currentSemester === sem.id ? 'default' : 'outline'}
              className="cursor-pointer px-3 py-1 text-xs font-bold"
              onClick={() => handleSubFilterChange('semester', sem.id)}
            >
              {sem.name}
            </Badge>
          ))}
        </div>
      )}

      {currentFilter === 'pathway' && pathways.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {pathways.map((pw) => (
            <Badge
              key={pw.id}
              variant={currentPathway === pw.id ? 'default' : 'outline'}
              className="cursor-pointer px-3 py-1 text-xs font-bold"
              onClick={() => handleSubFilterChange('pathway', pw.id)}
            >
              {pw.name}
            </Badge>
          ))}
        </div>
      )}

      {currentFilter === 'class' && classes.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {classes.map((cls) => (
            <Badge
              key={cls.id}
              variant={currentClassId === cls.id ? 'default' : 'outline'}
              className="cursor-pointer px-3 py-1 text-xs font-bold"
              onClick={() => handleSubFilterChange('classId', cls.id)}
            >
              {cls.label}
            </Badge>
          ))}
        </div>
      )}

      {isPending && (
        <div className="h-1 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div className="h-full w-1/3 animate-pulse rounded-full bg-sky-400" />
        </div>
      )}
    </div>
  )
}
