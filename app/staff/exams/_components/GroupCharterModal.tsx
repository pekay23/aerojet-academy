'use client'

import { useState, useEffect } from 'react'
import { Users, Loader2, CheckCircle, X, Building2, Search } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useRouter } from 'next/navigation'
import { useDebouncedCallback } from 'use-debounce'
import { searchStudents } from '@/app/staff/actions/search'

interface Event {
  id: string
  name: string
}

interface Module {
  id: string
  code: string
  name: string
}

interface GroupCharterModalProps {
  events: Event[]
  modules: Module[]
}

interface StudentOption {
  id: string
  email: string
  firstName: string
  lastName: string
  studentId: string
}

export function GroupCharterModal({ events, modules }: GroupCharterModalProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Fix #2: Auto-close modal after success (was stuck due to setTimeout only)
  useEffect(() => {
    if (!success) return
    const timer = setTimeout(() => {
      setOpen(false)
      router.refresh()
    }, 1500)
    return () => clearTimeout(timer)
  }, [success, router])

  const [eventId, setEventId] = useState('')
  const [groupName, setGroupName] = useState('')
  const [memberCount, setMemberCount] = useState(1)
  const [selectedModules, setSelectedModules] = useState<string[]>([])
  const [repUserId, setRepUserId] = useState('')

  // Fix #1: Student search state
  const [repStudents, setRepStudents] = useState<StudentOption[]>([])
  const [repQuery, setRepQuery] = useState('')
  const [repSearching, setRepSearching] = useState(false)

  const toggleModule = (id: string) => {
    setSelectedModules((prev) => (prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]))
  }

  // Debounced student search using useDebouncedCallback (avoids cascading renders)
  const doSearch = useDebouncedCallback(async (q: string) => {
    if (q.length < 2) {
      setRepStudents([])
      return
    }
    setRepSearching(true)
    try {
      const result = await searchStudents(q)
      setRepStudents(result.students || [])
    } catch {
      setRepStudents([])
    } finally {
      setRepSearching(false)
    }
  }, 250)

  const handleSearchChange = (q: string) => {
    setRepQuery(q)
    doSearch(q)
  }

  const handleSubmit = async () => {
    if (!repUserId || !eventId || !groupName.trim() || selectedModules.length === 0) {
      setError('All fields are required')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/staff/exam-pools/charter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repUserId,
          eventId,
          groupName: groupName.trim(),
          memberCount,
          modules: selectedModules,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to create group charter')
      } else {
        setSuccess(true)
      }
    } catch {
      setError('Network error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setOpen(false)
    setRepUserId('')
    setEventId('')
    setGroupName('')
    setMemberCount(1)
    setSelectedModules([])
    setError(null)
    setSuccess(false)
    setRepStudents([])
    setRepQuery('')
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) handleClose()
        else setOpen(true)
      }}
    >
      <DialogTrigger asChild>
        <button className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800">
          <Building2 className="h-4 w-4" />
          Group Charter
        </button>
      </DialogTrigger>

      <DialogContent className="max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-aerojet-blue flex items-center gap-2 text-lg font-black">
            <Building2 className="h-5 w-5" />
            Create Group Charter Booking
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <p className="text-xs text-slate-500">
            Group charters reserve a dedicated pool (up to 28 seats) for an organisation or military
            group. The representative&apos;s wallet will be charged €7,500.
          </p>

          {/* Fix #1: Representative Student — searchable combobox */}
          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">
              Representative Student
            </label>
            <div className="relative">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={repQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search by name, email, or student ID..."
                className="focus:border-aerojet-blue focus:ring-aerojet-blue/20 w-full rounded-xl border border-slate-200 bg-white py-2.5 pr-10 pl-10 text-sm font-medium shadow-sm focus:ring-2 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
              {repSearching && (
                <Loader2 className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" />
              )}
            </div>
            {repStudents.length > 0 && (
              <div className="z-50 mt-1 max-h-60 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
                {repStudents.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setRepUserId(s.id)
                      setRepQuery(`${s.firstName} ${s.lastName} (${s.studentId})`)
                      setRepStudents([])
                    }}
                    className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                      repUserId === s.id
                        ? 'bg-aerojet-blue/10 text-aerojet-blue font-bold'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="text-aerojet-blue flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-bold dark:bg-slate-800">
                      {s.firstName.charAt(0)}
                      {s.lastName.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium text-slate-900 dark:text-slate-100">
                        {s.firstName} {s.lastName}
                      </div>
                      <div className="truncate text-xs text-slate-500 dark:text-slate-400">
                        {s.studentId} · {s.email}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {repQuery.length >= 2 && !repSearching && repStudents.length === 0 && (
              <div className="mt-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-lg dark:border-slate-700 dark:bg-slate-900">
                No students found matching &ldquo;{repQuery}&rdquo;
              </div>
            )}
          </div>

          {/* Event */}
          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">
              Exam Event
            </label>
            <select
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              className="focus:border-aerojet-blue focus:ring-aerojet-blue/20 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium shadow-sm focus:ring-2 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            >
              <option value="">— Select event —</option>
              {events.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          </div>

          {/* Group Name */}
          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">
              Organisation / Group Name
            </label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="e.g. Irish Air Corps, Ryanair"
              className="focus:border-aerojet-blue focus:ring-aerojet-blue/20 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium shadow-sm focus:ring-2 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>

          {/* Member Count */}
          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">
              Expected Members (max 28)
            </label>
            <input
              type="number"
              min={1}
              max={28}
              value={memberCount}
              onChange={(e) =>
                setMemberCount(Math.min(28, Math.max(1, parseInt(e.target.value) || 1)))
              }
              className="focus:border-aerojet-blue focus:ring-aerojet-blue/20 w-28 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium shadow-sm focus:ring-2 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>

          {/* Module Selection */}
          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">
              Exam Modules
            </label>
            <div className="max-h-40 space-y-1 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-2 dark:border-slate-700 dark:bg-slate-800/30">
              {modules.map((m) => (
                <label
                  key={m.id}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                    selectedModules.includes(m.id)
                      ? 'bg-aerojet-blue/10 text-aerojet-blue font-bold'
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700/50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedModules.includes(m.id)}
                    onChange={() => toggleModule(m.id)}
                    className="accent-aerojet-blue rounded"
                  />
                  <span className="font-mono text-xs">{m.code}</span>
                  <span className="truncate">{m.name}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-slate-400">{selectedModules.length} module(s) selected</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-sm font-medium text-red-700 dark:border-red-900/20 dark:bg-red-900/10 dark:text-red-400">
              <X className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-sm font-medium text-emerald-700">
              <CheckCircle className="h-4 w-4 shrink-0" />
              Group charter created! Refreshing...
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={handleClose}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={
                isSubmitting ||
                success ||
                !repUserId ||
                !eventId ||
                !groupName.trim() ||
                selectedModules.length === 0
              }
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              <Users className="h-4 w-4" />
              Create Charter
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
