'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Filter } from 'lucide-react'

interface CourseCategoryFilterProps {
  categories: string[]
  currentCategory?: string
}

const categoryLabel: Record<string, string> = {
  FOUR_YEAR: '4-Year Programme',
  TWO_YEAR: '2-Year Programme',
  MILITARY: 'Military / Industry',
  MODULAR: 'Modular',
  EXAM_ONLY: 'Exam Only',
  REVISION: 'Revision Support',
}

export function CourseCategoryFilter({ categories, currentCategory }: CourseCategoryFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleCategoryChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === 'all') {
      params.delete('category')
    } else {
      params.set('category', value)
    }
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="w-full md:w-auto">
      <Select value={currentCategory || 'all'} onValueChange={handleCategoryChange}>
        <SelectTrigger className="h-11 w-full border-slate-100 bg-white px-5 text-xs font-black tracking-widest text-[#002a5c] uppercase shadow-sm transition-all hover:bg-slate-50 md:w-[220px] dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800">
          <div className="flex items-center gap-2.5">
            <Filter className="h-3.5 w-3.5 text-[#4c9ded]" />
            <SelectValue placeholder="All Categories" />
          </div>
        </SelectTrigger>
        <SelectContent className="border-slate-100 bg-white/95 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/95">
          <SelectItem
            value="all"
            className="text-[10px] font-black tracking-widest text-[#002a5c] uppercase focus:bg-slate-50 dark:text-slate-300 dark:focus:bg-slate-800"
          >
            All Categories
          </SelectItem>
          {categories.map((cat) => (
            <SelectItem
              key={cat}
              value={cat}
              className="text-[10px] font-black tracking-widest text-[#002a5c] uppercase focus:bg-slate-50 dark:text-slate-300 dark:focus:bg-slate-800"
            >
              {categoryLabel[cat] || cat.replace(/_/g, ' ')}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
