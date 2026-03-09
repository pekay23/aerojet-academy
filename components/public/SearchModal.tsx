'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X, ArrowRight, FileText, BookOpen, GraduationCap, Calendar, Loader2 } from 'lucide-react'
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

const CATEGORY_COLORS: Record<string, string> = {
  Pages: 'bg-blue-50 text-blue-600',
  Courses: 'bg-emerald-50 text-emerald-600',
  Modules: 'bg-purple-50 text-purple-600',
  Exams: 'bg-amber-50 text-amber-600',
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
      setQuery('')
      setResults([])
      setSelectedIndex(0)
    }
  }, [open])

  // Debounced search
  useEffect(() => {
    if (query.length < 2) {
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

  return (
    <>
      {/* Search trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="group flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold tracking-wider uppercase transition-all"
        aria-label="Search"
      >
        <Search className="h-4 w-4" />
        <span className="hidden xl:inline">Search</span>
        <kbd className="hidden rounded-md border border-current/20 px-1.5 py-0.5 font-mono text-[9px] opacity-60 lg:inline">
          ⌘K
        </kbd>
      </button>

      {/* Modal overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-100 flex items-start justify-center bg-slate-900/60 pt-[15vh] backdrop-blur-sm"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Search Input */}
              <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
                <Search className="h-5 w-5 shrink-0 text-slate-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search courses, exams, pages..."
                  className="flex-1 bg-transparent text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100"
                />
                {loading && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Results */}
              <div className="max-h-[50vh] overflow-y-auto">
                {query.length < 2 ? (
                  <div className="px-5 py-8 text-center">
                    <p className="text-xs text-slate-400">Type at least 2 characters to search</p>
                    <div className="mt-4 flex flex-wrap justify-center gap-2">
                      {['Exam Only', 'EASA Part 66', 'Modular', 'Pool', 'Fees'].map((suggestion) => (
                        <button
                          key={suggestion}
                          onClick={() => setQuery(suggestion)}
                          className="rounded-lg bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-400"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : results.length === 0 && !loading ? (
                  <div className="px-5 py-8 text-center">
                    <p className="text-sm font-medium text-slate-500">No results for &ldquo;{query}&rdquo;</p>
                    <p className="mt-1 text-xs text-slate-400">Try searching for courses, exam options, or pages</p>
                  </div>
                ) : (
                  <div className="py-2">
                    {Object.entries(grouped).map(([category, items]) => {
                      const CategoryIcon = CATEGORY_ICONS[category] || FileText
                      const colorClass = CATEGORY_COLORS[category] || 'bg-slate-50 text-slate-600'
                      return (
                        <div key={category}>
                          <div className="flex items-center gap-2 px-5 pt-3 pb-1">
                            <div className={`flex h-5 w-5 items-center justify-center rounded ${colorClass}`}>
                              <CategoryIcon className="h-3 w-3" />
                            </div>
                            <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                              {category}
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
                                className={`group flex w-full items-center gap-3 px-5 py-3 text-left transition-colors ${
                                  selectedIndex === idx
                                    ? 'bg-blue-50 dark:bg-blue-900/20'
                                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                }`}
                              >
                                <div className="min-w-0 flex-1">
                                  <p
                                    className={`truncate text-sm font-bold ${
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
              <div className="flex items-center justify-between border-t border-slate-100 px-5 py-2.5 dark:border-slate-800">
                <div className="flex items-center gap-3 text-[10px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <kbd className="rounded border border-slate-200 px-1 py-0.5 font-mono dark:border-slate-700">↑↓</kbd>
                    Navigate
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="rounded border border-slate-200 px-1 py-0.5 font-mono dark:border-slate-700">↵</kbd>
                    Open
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="rounded border border-slate-200 px-1 py-0.5 font-mono dark:border-slate-700">Esc</kbd>
                    Close
                  </span>
                </div>
                <span className="text-[10px] font-bold text-slate-300 dark:text-slate-600">
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
