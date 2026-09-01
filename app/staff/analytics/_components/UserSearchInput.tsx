'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface Student {
  id: string
  email: string
  profile: {
    firstName: string | null
    lastName: string | null
  } | null
  studentProfile: {
    studentId: string | null
  } | null
}

interface UserSearchInputProps {
  onSelect: (userId: string) => void
  onTrack: () => void
  loading: boolean
  disabled: boolean
}

export default function UserSearchInput({ onSelect, onTrack, loading, disabled }: UserSearchInputProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [students, setStudents] = useState<Student[]>([])
  const [searching, setSearching] = useState(false)
  const [selectedId, setSelectedId] = useState('')
  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const fetchStudents = useCallback(async (searchQuery: string) => {
    setSearching(true)
    try {
      const res = await fetch(`/api/staff/users/search?q=${encodeURIComponent(searchQuery)}`)
      const json = await res.json()
      if (json.success) {
        setStudents(json.data)
      }
    } catch (err) {
      toast.error('Search failed')
    } finally {
      setSearching(false)
    }
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      fetchStudents(query)
    }, 200)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, fetchStudents])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleFocus = () => {
    setIsOpen(true)
    if (students.length === 0 && !query) {
      fetchStudents('')
    }
  }

  const handleSelect = (student: Student) => {
    setSelectedId(student.id)
    onSelect(student.id)
    setIsOpen(false)
    setQuery('')
  }

  const displayName = (student: Student) => {
    const name = [student.profile?.firstName, student.profile?.lastName].filter(Boolean).join(' ')
    return name || 'Unknown'
  }

  return (
    <div ref={wrapperRef} className="relative flex-1">
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
        <Input
          ref={inputRef}
          value={isOpen ? query : (selectedId ? '' : query)}
          onChange={(e) => {
            setQuery(e.target.value)
            if (!isOpen) setIsOpen(true)
            if (selectedId) setSelectedId('')
          }}
          onFocus={handleFocus}
          placeholder="Search students by name, email, or ID..."
          className="rounded-xl border-slate-200 bg-white pl-9 pr-10 font-bold dark:border-slate-700 dark:bg-slate-900"
          onKeyDown={(e) => e.key === 'Enter' && !isOpen && onTrack()}
        />
        {searching && (
          <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-slate-400" />
        )}
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
          {students.length === 0 && !searching && (
            <div className="px-3 py-4 text-center text-xs text-slate-500">
              {query.length < 2 ? 'Type at least 2 characters to search...' : 'No students found'}
            </div>
          )}
          {students.map((student) => (
            <button
              key={student.id}
              type="button"
              onClick={() => handleSelect(student)}
              className="flex w-full flex-col gap-0.5 px-3 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {displayName(student)}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {student.email} {student.studentProfile?.studentId ? `• ${student.studentProfile.studentId}` : ''}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
