'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search,
  X,
  ArrowRight,
  FileText,
  BookOpen,
  GraduationCap,
  Calendar,
  Loader2,
  Sparkles,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface SearchResult {
  title: string
  description: string
  url: string
  category: string
}

const CATEGORY_ICONS: Record<string, typeof Search> = {
  Pages: FileText,
  Courses: GraduationCap,
  Modules: BookOpen,
  Exams: Calendar,
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string; ring: string }> = {
  Pages: {
    bg: 'bg-blue-50 dark:bg-blue-900/30',
    text: 'text-blue-600 dark:text-blue-400',
    ring: 'ring-blue-100 dark:ring-blue-800',
  },
  Courses: {
    bg: 'bg-emerald-50 dark:bg-emerald-900/30',
    text: 'text-emerald-600 dark:text-emerald-400',
    ring: 'ring-emerald-100 dark:ring-emerald-800',
  },
  Modules: {
    bg: 'bg-purple-50 dark:bg-purple-900/30',
    text: 'text-purple-600 dark:text-purple-400',
    ring: 'ring-purple-100 dark:ring-purple-800',
  },
  Exams: {
    bg: 'bg-amber-50 dark:bg-amber-900/30',
    text: 'text-amber-600 dark:text-amber-400',
    ring: 'ring-amber-100 dark:ring-amber-800',
  },
}

export default function SearchModal() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // Cmd+K / Ctrl+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
      if (e.key === 'Escape') {
        setOpen(false)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Focus input when modal opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100)
    } else {
   
  // eslint-disable-next-line react-hooks/set-state-in-effect
      setQuery('')
      setResults([])
      setSelectedIndex(0)
    }
  }, [open])

  // Debounced search
  useEffect(() => {
   
    if (query.length < 2) {
  // eslint-disable-next-line react-hooks/set-state-in-effect
      setResults([])
      return
    }

    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
        const data = await res.json()
        setResults(data.results || [])
        setSelectedIndex(0)
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 250)

    return () => clearTimeout(timer)
  }, [query])

  const navigateToResult = useCallback(
    (result: SearchResult) => {
      setOpen(false)
      router.push(result.url)
    },
    [router]
  )

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      navigateToResult(results[selectedIndex])
    }
  }

  // Group results by category
  const grouped = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    if (!acc[r.category]) acc[r.category] = []
    acc[r.category].push(r)
    return acc
  }, {})

  let flatIndex = -1

  const quickLinks = [
    { label: 'Exam Only', icon: 'ðŸŽ¯' },
    { label: 'EASA Part 66', icon: 'âœˆï¸' },
    { label: 'Modular', icon: 'ðŸ“¦' },
    { label: 'Fees', icon: 'ðŸ’°' },
    { label: 'Pool', icon: 'ðŸ“‹' },
  ]

  return (
    <>
      {/* Search trigger — icon only */}
      <button
        onClick={() => setOpen(true)}
        className="group flex items-center gap-2 rounded-lg px-3 py-2 transition-all"
        aria-label="Search"
      >
        <Search className="h-4 w-4" />
      </button>

      {/* Modal overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-100 flex items-start justify-center bg-slate-900/60 pt-[12vh] backdrop-blur-sm"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -20 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              className="w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200/50 bg-white shadow-2xl shadow-slate-900/20 dark:border-slate-700/50 dark:bg-slate-900"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Search Input */}
              <div className="flex items-center gap-4 px-6 py-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                  ) : (
                    <Search className="h-5 w-5 text-slate-400" />
                  )}
                </div>
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search courses, exams, pages..."
                  className="flex-1 bg-transparent text-base font-medium text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100"
                />
                <button
                  onClick={() => setOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="h-px bg-linear-to-r from-transparent via-slate-200 to-transparent dark:via-slate-700" />

              {/* Results */}
              <div
                className="max-h-[55vh] overflow-y-auto"
                style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(0,0,0,0.1) transparent' }}
              >
                {query.length < 2 ? (
                  <div className="px-6 py-10 text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                      <Sparkles className="h-6 w-6 text-slate-300 dark:text-slate-600" />
                    </div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                      Type to search across all pages
                    </p>
                    <div className="mt-6 flex flex-wrap justify-center gap-2">
                      {quickLinks.map((item) => (
                        <button
                          key={item.label}
                          onClick={() => setQuery(item.label)}
                          className="flex items-center gap-1.5 rounded-xl bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-600 transition-all hover:bg-slate-100 hover:shadow-sm dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
                        >
                          <span>{item.icon}</span>
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : results.length === 0 && !loading ? (
                  <div className="px-6 py-12 text-center">
                    <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                      <Search className="h-6 w-6 text-slate-300 dark:text-slate-600" />
                    </div>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                      No results for &ldquo;{query}&rdquo;
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Try different keywords or browse courses directly
                    </p>
                  </div>
                ) : (
                  <div className="py-3">
                    {Object.entries(grouped).map(([category, items]) => {
                      const CategoryIcon = CATEGORY_ICONS[category] || FileText
                      const colors = CATEGORY_COLORS[category] || CATEGORY_COLORS.Pages
                      return (
                        <div key={category}>
                          <div className="flex items-center gap-2.5 px-6 pt-4 pb-2">
                            <div
                              className={`flex h-6 w-6 items-center justify-center rounded-lg ${colors.bg}`}
                            >
                              <CategoryIcon className={`h-3.5 w-3.5 ${colors.text}`} />
                            </div>
                            <span className="text-xs font-black tracking-widest text-slate-400 uppercase dark:text-slate-500">
                              {category}
                            </span>
                            <span className="text-xs font-bold text-slate-300 dark:text-slate-600">
                              {items.length}
                            </span>
                          </div>
                          {items.map((result) => {
                            flatIndex++
                            const idx = flatIndex
                            return (
                              <button
                                key={`${result.url}-${result.title}`}
                                onClick={() => navigateToResult(result)}
                                onMouseEnter={() => setSelectedIndex(idx)}
                                className={`group flex w-full items-center gap-4 px-6 py-3.5 text-left transition-all ${
                                  selectedIndex === idx
                                    ? 'bg-blue-50/80 dark:bg-blue-900/20'
                                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                }`}
                              >
                                <div className="min-w-0 flex-1">
                                  <p
                                    className={`text-sm font-bold ${
                                      selectedIndex === idx
                                        ? 'text-blue-700 dark:text-blue-300'
                                        : 'text-slate-900 dark:text-slate-100'
                                    }`}
                                  >
                                    {result.title}
                                  </p>
                                  <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                                    {result.description}
                                  </p>
                                </div>
                                <ArrowRight
                                  className={`h-4 w-4 shrink-0 transition-all ${
                                    selectedIndex === idx
                                      ? 'translate-x-0 text-blue-500 opacity-100'
                                      : '-translate-x-1 text-slate-300 opacity-0'
                                  }`}
                                />
                              </button>
                            )
                          })}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between border-t border-slate-100 px-6 py-3 dark:border-slate-800">
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <kbd className="rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[9px] dark:border-slate-700 dark:bg-slate-800">
                      â†‘â†“
                    </kbd>
                    Navigate
                  </span>
                  <span className="flex items-center gap-1.5">
                    <kbd className="rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[9px] dark:border-slate-700 dark:bg-slate-800">
                      â†µ
                    </kbd>
                    Open
                  </span>
                  <span className="flex items-center gap-1.5">
                    <kbd className="rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[9px] dark:border-slate-700 dark:bg-slate-800">
                      Esc
                    </kbd>
                    Close
                  </span>
                </div>
                <span className="text-xs font-black tracking-widest text-slate-300 uppercase dark:text-slate-600">
                  Aerojet Search
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
