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
  categories: { id: string; name: string }[]
  currentCategory?: string
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
        <SelectTrigger className="text-aerojet-blue h-11 w-full border-slate-100 bg-white px-5 text-xs font-black tracking-widest uppercase shadow-sm transition-all hover:bg-slate-50 md:w-55 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800">
          <div className="flex items-center gap-2.5">
            <Filter className="text-aerojet-sky h-3.5 w-3.5" />
            <SelectValue placeholder="All Categories" />
          </div>
        </SelectTrigger>
        <SelectContent className="border-slate-100 bg-white/95 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/95">
          <SelectItem
            value="all"
            className="text-aerojet-blue text-[10px] font-black tracking-widest uppercase focus:bg-slate-50 dark:text-slate-300 dark:focus:bg-slate-800"
          >
            All Categories
          </SelectItem>
          {categories.map((cat) => (
            <SelectItem
              key={cat.id}
              value={cat.name}
              className="text-aerojet-blue text-[10px] font-black tracking-widest uppercase focus:bg-slate-50 dark:text-slate-300 dark:focus:bg-slate-800"
            >
              {cat.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
