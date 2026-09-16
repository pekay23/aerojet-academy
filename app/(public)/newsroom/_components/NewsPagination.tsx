'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

interface NewsPaginationProps {
  total: number
  page: number
  limit: number
}

export default function NewsPagination({ total, page, limit }: NewsPaginationProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const totalPages = Math.ceil(total / limit)
  if (total === 0) return null

  const createQueryString = (name: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set(name, value)
    if (name === 'limit') params.set('page', '1') // Better UX: reset to page 1 on limit change
    return params.toString()
  }

  const handlePageChange = (newPage: number) => {
    router.push(`${pathname}?${createQueryString('page', newPage.toString())}`, { scroll: false })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleLimitChange = (newLimit: string) => {
    router.push(`${pathname}?${createQueryString('limit', newLimit)}`, { scroll: false })
  }

  // Generate page numbers to show (smart range)
  const getPageNumbers = () => {
    const pages = []
    const showPages = 5
    let start = Math.max(1, page - Math.floor(showPages / 2))
    const end = Math.min(totalPages, start + showPages - 1)

    if (end - start + 1 < showPages) {
      start = Math.max(1, end - showPages + 1)
    }

    for (let i = Math.max(1, start); i <= end; i++) {
      pages.push(i)
    }
    return pages
  }

  return (
    <div className="mt-16 flex flex-col items-center justify-between gap-8 border-t border-slate-100 pt-10 sm:flex-row">
      <div className="flex items-center gap-4">
        <span className="text-xs font-black tracking-widest text-slate-400 uppercase">Per Page</span>
        <Select value={limit.toString()} onValueChange={handleLimitChange}>
          <SelectTrigger className="h-10 w-[80px] rounded-xl border-slate-200 bg-white text-xs font-bold ring-offset-white focus:ring-aerojet-blue/20">
            <SelectValue placeholder={limit.toString()} />
          </SelectTrigger>
          <SelectContent className="rounded-2xl border-slate-100 bg-white p-1.5 shadow-2xl">
            {[9, 18, 27, 45].map((val) => (
              <SelectItem
                key={val}
                value={val.toString()}
                className="rounded-xl text-xs font-bold hover:bg-slate-50 focus:bg-slate-50"
              >
                {val}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="hidden h-10 w-10 rounded-xl border-slate-200 bg-white transition-all hover:bg-slate-50 disabled:opacity-20 sm:flex"
          onClick={() => handlePageChange(1)}
          disabled={page <= 1}
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-10 w-10 rounded-xl border-slate-200 bg-white transition-all hover:bg-slate-50 disabled:opacity-20"
          onClick={() => handlePageChange(page - 1)}
          disabled={page <= 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-2 px-1">
          {getPageNumbers().map((p) => (
            <Button
              key={p}
              variant={p === page ? 'default' : 'outline'}
              className={`h-10 w-10 rounded-xl text-xs font-black transition-all ${
                p === page
                  ? 'bg-aerojet-blue text-white shadow-xl shadow-blue-900/20'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-aerojet-blue hover:text-aerojet-blue hover:shadow-lg'
              }`}
              onClick={() => handlePageChange(p)}
            >
              {p}
            </Button>
          ))}
        </div>

        <Button
          variant="outline"
          size="icon"
          className="h-10 w-10 rounded-xl border-slate-200 bg-white transition-all hover:bg-slate-50 disabled:opacity-20"
          onClick={() => handlePageChange(page + 1)}
          disabled={page >= totalPages}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="hidden h-10 w-10 rounded-xl border-slate-200 bg-white transition-all hover:bg-slate-50 disabled:opacity-20 sm:flex"
          onClick={() => handlePageChange(totalPages)}
          disabled={page >= totalPages}
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="hidden lg:block">
        <p className="text-xs font-black tracking-[0.3em] text-slate-400 uppercase">
          {total} Total Articles
        </p>
      </div>
    </div>
  )
}
