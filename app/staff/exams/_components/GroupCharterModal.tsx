'use client'

import { useState, useEffect } from 'react'
import { Users, Loader2, CheckCircle, X, Building2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useRouter } from 'next/navigation'

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

export function GroupCharterModal({ events, modules }: GroupCharterModalProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [repUserId, setRepUserId] = useState('')
  const [eventId, setEventId] = useState('')
  const [groupName, setGroupName] = useState('')
  const [memberCount, setMemberCount] = useState(1)
  const [selectedModules, setSelectedModules] = useState<string[]>([])

  const toggleModule = (id: string) => {
    setSelectedModules((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    )
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
        setTimeout(() => {
          setOpen(false)
          router.refresh()
        }, 1500)
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
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else setOpen(true) }}>
      <DialogTrigger asChild>
        <button className="flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm font-bold text-indigo-700 transition-all hover:border-indigo-300 hover:bg-indigo-100 dark:border-indigo-900/30 dark:bg-indigo-900/10 dark:text-indigo-400">
          <Building2 className="h-4 w-4" />
          Group Charter
        </button>
      </DialogTrigger>

      <DialogContent className="max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-black text-aerojet-blue">
            <Building2 className="h-5 w-5" />
            Create Group Charter Booking
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <p className="text-xs text-slate-500">
            Group charters reserve a dedicated pool (up to 28 seats) for an organisation
            or military group. The representative&apos;s wallet will be charged €7,500.
          </p>

          {/* Representative User ID */}
          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">
              Representative User ID
            </label>
            <input
              type="text"
              value={repUserId}
              onChange={(e) => setRepUserId(e.target.value)}
              placeholder="Paste student/rep user ID"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium shadow-sm focus:border-aerojet-blue focus:outline-none focus:ring-2 focus:ring-aerojet-blue/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>

          {/* Event */}
          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">
              Exam Event
            </label>
            <select
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium shadow-sm focus:border-aerojet-blue focus:outline-none focus:ring-2 focus:ring-aerojet-blue/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            >
              <option value="">— Select event —</option>
              {events.map((e) => (
                <option key={e.id} value={e.id}>{e.name}</option>
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
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium shadow-sm focus:border-aerojet-blue focus:outline-none focus:ring-2 focus:ring-aerojet-blue/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
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
              onChange={(e) => setMemberCount(Math.min(28, Math.max(1, parseInt(e.target.value) || 1)))}
              className="w-28 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium shadow-sm focus:border-aerojet-blue focus:outline-none focus:ring-2 focus:ring-aerojet-blue/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
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
                      ? 'bg-aerojet-blue/10 font-bold text-aerojet-blue'
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700/50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedModules.includes(m.id)}
                    onChange={() => toggleModule(m.id)}
                    className="rounded accent-aerojet-blue"
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
              disabled={isSubmitting || success || !repUserId || !eventId || !groupName.trim() || selectedModules.length === 0}
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
