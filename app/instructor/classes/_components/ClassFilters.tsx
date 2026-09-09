'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronDown, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FilterOption {
  id: string
  name: string
}

interface ClassFiltersProps {
  options: {
    academicYears: FilterOption[]
    semesters: FilterOption[]
    categories: FilterOption[]
  }
  current: {
    academicYear?: string
    semester?: string
    category?: string
    status?: string
  }
}

export default function ClassFilters({ options, current }: ClassFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const updateParams = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([key, value]) => {
      if (value) params.set(key, value)
      else params.delete(key)
    })
    router.push(`/instructor/classes?${params.toString()}`)
  }

  const clearFilters = () => {
    router.push('/instructor/classes')
  }

  const hasActiveFilters =
    current.academicYear || current.semester || current.category || current.status

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      {/* Filter Label */}
      <span className="text-xs font-bold tracking-widest text-slate-400 uppercase">Filters:</span>

      {/* Academic Year */}
      <SelectFilter
        label="Year"
        value={current.academicYear}
        options={options.academicYears}
        onChange={(v) => updateParams({ academicYear: v })}
        placeholder="All Years"
      />

      {/* Semester */}
      <SelectFilter
        label="Semester"
        value={current.semester}
        options={options.semesters}
        onChange={(v) => updateParams({ semester: v })}
        placeholder="All Semesters"
      />

      {/* Category */}
      <SelectFilter
        label="Category"
        value={current.category}
        options={options.categories}
        onChange={(v) => updateParams({ category: v })}
        placeholder="All Categories"
      />

      {/* Status */}
      <SelectFilter
        label="Status"
        value={current.status}
        options={[
          { id: 'upcoming', name: 'Upcoming' },
          { id: 'active', name: 'Active' },
          { id: 'completed', name: 'Completed' },
        ]}
        onChange={(v) => updateParams({ status: v })}
        placeholder="All Statuses"
      />

      {/* Clear Filters */}
      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-500 transition-all hover:border-slate-300 hover:text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:text-slate-200"
        >
          <X className="h-3.5 w-3.5" />
          Clear
        </button>
      )}
    </div>
  )
}

function SelectFilter({
  label,
  value,
  options,
  onChange,
  placeholder,
}: {
  label: string
  value?: string
  options: FilterOption[]
  onChange: (value: string | undefined) => void
  placeholder: string
}) {
  return (
    <div className="relative">
      <label className="sr-only">{label}</label>
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value || undefined)}
        className={cn(
          'appearance-none rounded-xl border border-slate-200 bg-white px-3 py-2 pr-10 text-xs font-medium text-slate-700',
          'dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200',
          'focus:ring-aerojet-sky/20 focus:border-aerojet-sky focus:ring-2 focus:outline-none'
        )}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {opt.name}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-2 h-4 w-4 -translate-y-1/2 text-slate-400" />
    </div>
  )
}
