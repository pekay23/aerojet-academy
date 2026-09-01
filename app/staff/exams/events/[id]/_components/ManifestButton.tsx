'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Download, Eye, ChevronDown, ChevronUp, FileText } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Sitting {
  id: string
  dayNumber: number
  sessionType: string
  startTime: string
  capacity: number
  status: string
  examComponent: { course?: { code: string }; code: string }
  assignments: Array<{
    id: string
    userId: string
    seatId: string | null
    attendanceStatus: string
    user: { profile: { firstName: string; lastName: string } | null; email: string }
  }>
}

interface Props {
  eventId: string
  sittings: Sitting[]
}

export default function ManifestButton({ eventId, sittings }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const download = (format: 'csv' | 'pdf') => {
    const url = `/api/staff/exams/events/${eventId}/manifest?format=${format}`
    window.open(url, '_blank')
    toast.success(`Downloading ${format.toUpperCase()} manifest...`)
    setOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 transition-all hover:border-slate-300 hover:shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-slate-600"
      >
        <FileText className="h-4 w-4" />
        Manifest
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-48 rounded-xl border border-slate-200 bg-white py-2 shadow-lg dark:border-slate-700 dark:bg-slate-900">
            <button
              onClick={() => {
                router.push(`/staff/exams/events/${eventId}/manifest`)
                setOpen(false)
              }}
              className="flex w-full items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <Eye className="h-4 w-4" />
              Preview Manifest
            </button>
            <button
              onClick={() => download('csv')}
              className="flex w-full items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <Download className="h-4 w-4" />
              Download CSV
            </button>
            <button
              onClick={() => download('pdf')}
              className="flex w-full items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <Download className="h-4 w-4" />
              Download PDF
            </button>
          </div>
        </>
      )}
    </div>
  )
}
