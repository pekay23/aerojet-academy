'use client'

import { useState, useEffect } from 'react'
import { FileText, Save, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  student: any
  onRefresh: () => void
}

export default function AdminNotesTab({ student, onRefresh }: Props) {
  const [notes, setNotes] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Use adminNotes from studentProfile if available
  useEffect(() => {
    // Initialize with notes from studentProfile if available
    if (student?.studentProfile?.adminNotes) {
      setNotes(student.studentProfile.adminNotes)
      setIsLoading(false)
    } else {
      // Otherwise fetch from API
      async function fetchData() {
        try {
          const notesResponse = await fetch(`/api/staff/students/${student.id}/admin-notes`)
          if (notesResponse.ok) {
            const notesData = await notesResponse.json()
            setNotes(notesData.notes || '')
          }
        } catch (error) {
          console.error('Failed to fetch notes:', error)
        } finally {
          setIsLoading(false)
        }
      }
      if (student?.id) {
        fetchData()
      }
    }
  }, [student?.id, student?.studentProfile])

  const handleSaveNotes = async () => {
    if (!student?.id) return

    setIsSaving(true)
    try {
      const response = await fetch(`/api/staff/students/${student.id}/admin-notes`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      })

      if (response.ok) {
        toast.success('Notes saved')
        onRefresh()
      } else {
        toast.error('Failed to save notes')
      }
    } catch (error) {
      console.error('Failed to save notes:', error)
      toast.error('Failed to save notes')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <FileText className="h-5 w-5 text-[#002a5c]" />
        <h3 className="text-lg font-semibold">Admin Notes</h3>
      </div>

      {/* Editable Admin Notes */}
      <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <h4 className="mb-3 font-medium text-slate-700 dark:text-slate-300">
          Internal Notes
        </h4>
        <p className="mb-3 text-sm text-slate-500">
          Add private notes about this student. These notes are only visible to admins.
        </p>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add private notes about this student..."
          className="min-h-[200px] w-full rounded-md border border-slate-300 p-3 text-sm focus:border-[#002a5c] focus:outline-none focus:ring-1 focus:ring-[#002a5c] dark:border-slate-600 dark:bg-slate-800 dark:text-white"
        />
        <div className="mt-3 flex justify-end">
          <button
            onClick={handleSaveNotes}
            disabled={isSaving}
            className="flex items-center gap-2 rounded-md bg-[#002a5c] px-4 py-2 text-sm font-medium text-white hover:bg-[#001d42] disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Notes
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      )}
    </div>
  )
}
