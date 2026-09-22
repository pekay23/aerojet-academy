'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, Loader2, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface Student {
  id: string
  email: string
  profile: { firstName: string | null; lastName: string | null } | null
  studentProfile: { studentId: string | null } | null
}

interface Props {
  value: string
  onChange: (id: string, display: string) => void
  placeholder?: string
  disabled?: boolean
  listboxId?: string
  id?: string
}

export function StudentSearchInput({
  value,
  onChange,
  placeholder = 'Search by name, email, or student ID…',
  disabled,
  listboxId = 'student-search-listbox',
  id,
}: Props) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [students, setStudents] = useState<Student[]>([])
  const [searching, setSearching] = useState(false)
  const [selectedId, setSelectedId] = useState('')
  const [activeIndex, setActiveIndex] = useState(-1)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const mountedRef = useRef(true)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const currentGenerationRef = useRef(0)

  // Sync internal selection state when the parent changes `value`.
  // Without this, a parent reset (e.g. closing the upload dialog) cannot
  // clear the child's stale selectedId / checkmark.
  const prevValueRef = useRef(value)
  useEffect(() => {
    prevValueRef.current = value
    if (!value) {
      setSelectedId('')
      setQuery('')
      setStudents([])
      setActiveIndex(-1)
    } else {
      setSelectedId(value)
      setQuery('')
      setActiveIndex(-1)
    }
  }, [value])

  useEffect(() => {
    return () => {
      mountedRef.current = false
      if (debounceRef.current) clearTimeout(debounceRef.current)
      abortRef.current?.abort()
    }
  }, [])

  const fetchStudents = async (searchQuery: string, generation: number) => {
    setSearching(true)
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    try {
      const res = await fetch(`/api/staff/users/search?q=${encodeURIComponent(searchQuery)}`, {
        signal: controller.signal,
      })
      const json = await res.json()
      // Ignore stale responses from older generations.
      if (generation !== currentGenerationRef.current) return
      if (json.success) {
        setStudents(json.data)
        setActiveIndex(-1)
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      // keep last results on network failure
    } finally {
      if (mountedRef.current) setSearching(false)
    }
  }

  const display = (s: Student) => {
    const name = [s.profile?.firstName, s.profile?.lastName].filter(Boolean).join(' ')
    return name || 'Unknown'
  }

  const selectStudent = (s: Student) => {
    setSelectedId(s.id)
    onChange(s.id, `${display(s)} · ${s.email}`)
    setOpen(false)
    setQuery('')
    setActiveIndex(-1)
    inputRef.current?.blur()
  }

  const moveActive = (dir: number) => {
    if (students.length === 0) return
    setActiveIndex((i) => {
      const next = i + dir
      if (next < 0) return students.length - 1
      if (next >= students.length) return 0
      return next
    })
  }

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <Search
          className="pointer-events-none absolute top-2.5 left-3 h-4 w-4 text-slate-400"
          aria-hidden
        />
        <Input
          ref={inputRef}
          id={id}
          role="combobox"
          aria-expanded={open}
          aria-controls={open ? listboxId : undefined}
          aria-haspopup="listbox"
          aria-autocomplete="list"
          value={open ? query : selectedId ? '' : query}
          onChange={(e) => {
            const v = e.target.value
            setQuery(v)
            if (!open) setOpen(true)
            if (selectedId) setSelectedId('')
            if (v.length >= 2) {
              if (debounceRef.current) clearTimeout(debounceRef.current)
              currentGenerationRef.current += 1
              const gen = currentGenerationRef.current
              debounceRef.current = setTimeout(() => {
                fetchStudents(v, gen)
              }, 200)
            } else {
              setStudents([])
            }
          }}
          onFocus={() => {
            setOpen(true)
            if (students.length === 0 && query.length >= 2) {
              currentGenerationRef.current += 1
              fetchStudents(query, currentGenerationRef.current)
            }
          }}
          onKeyDown={(e) => {
            if (!open || students.length === 0) return
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              moveActive(1)
            } else if (e.key === 'ArrowUp') {
              e.preventDefault()
              moveActive(-1)
            } else if (e.key === 'Enter' && activeIndex >= 0) {
              e.preventDefault()
              selectStudent(students[activeIndex])
            } else if (e.key === 'Escape') {
              e.preventDefault()
              setOpen(false)
              inputRef.current?.blur()
            }
          }}
          placeholder={placeholder}
          disabled={disabled}
          className="pl-9"
        />
        {searching && (
          <Loader2
            className="absolute top-2.5 right-3 h-4 w-4 animate-spin text-slate-400"
            aria-hidden
          />
        )}
        {selectedId && !open && (
          <Check className="absolute top-2.5 right-3 h-4 w-4 text-emerald-500" aria-hidden />
        )}
      </div>
      {open && (
        <div
          id={listboxId}
          role="listbox"
          aria-label="Student search results"
          className="absolute z-50 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900"
        >
          {students.length === 0 && !searching && query.length >= 2 && (
            <div
              role="status"
              aria-live="polite"
              className="px-3 py-4 text-center text-xs text-slate-500"
            >
              No students found.
            </div>
          )}
          {students.length === 0 && !searching && query.length < 2 && (
            <div
              role="status"
              aria-live="polite"
              className="px-3 py-4 text-center text-xs text-slate-500"
            >
              Type at least 2 characters…
            </div>
          )}
          {students.map((s, idx) => (
            <button
              key={s.id}
              type="button"
              role="option"
              aria-selected={selectedId === s.id}
              tabIndex={idx === activeIndex ? 0 : -1}
              ref={(el) => {
                if (idx === activeIndex && el) {
                  el.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
                }
              }}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => selectStudent(s)}
              className="flex w-full flex-col gap-0.5 px-3 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {display(s)}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {s.email} {s.studentProfile?.studentId ? `• ${s.studentProfile.studentId}` : ''}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
