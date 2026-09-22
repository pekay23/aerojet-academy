'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { UserPlus, Trash2, Pencil, X } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Mentor {
  id: string
  mentorId: string
  assignedDate: string
  endDate?: string | null
  isPrimary: boolean
  notes: string | null
}

interface Props {
  logbookId: string
  mentorAssignments: Mentor[]
  availableMentors: Array<{ id: string; label: string }>
}

export default function MentorAssignments({
  logbookId,
  mentorAssignments,
  availableMentors,
}: Props) {
  const router = useRouter()
  const [selectedMentor, setSelectedMentor] = useState('')
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editNotes, setEditNotes] = useState<Record<string, string>>({})
  const [editPrimary, setEditPrimary] = useState<Record<string, boolean>>({})

  const addMentor = async () => {
    if (!selectedMentor) return
    setLoading(true)
    try {
      const res = await fetch(`/api/staff/ojt/${logbookId}/mentors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mentorId: selectedMentor,
          isPrimary: mentorAssignments.length === 0,
        }),
      })
      if (!res.ok) throw new Error('Failed to assign mentor')
      toast.success('Mentor assigned')
      setSelectedMentor('')
      router.refresh()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to assign mentor')
    } finally {
      setLoading(false)
    }
  }

  const removeMentor = async (assignmentId: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/staff/ojt/${logbookId}/mentors/${assignmentId}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to remove mentor')
      toast.success('Mentor removed')
      router.refresh()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to remove mentor')
    } finally {
      setLoading(false)
    }
  }

  const updateMentor = async (assignmentId: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/staff/ojt/${logbookId}/mentors/${assignmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isPrimary: editPrimary[assignmentId] ?? false,
          notes: editNotes[assignmentId] ?? null,
        }),
      })
      if (!res.ok) throw new Error('Failed to update mentor')
      toast.success('Mentor updated')
      setEditingId(null)
      router.refresh()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to update mentor')
    } finally {
      setLoading(false)
    }
  }

  const startEdit = (m: Mentor) => {
    setEditingId(m.id)
    setEditNotes((n) => ({ ...n, [m.id]: m.notes || '' }))
    setEditPrimary((p) => ({ ...p, [m.id]: m.isPrimary }))
  }

  return (
    <div className="mt-6 rounded-2xl border border-slate-100 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
      <h3 className="text-lg font-black text-slate-900 dark:text-white">Mentor Assignments</h3>
      <div className="mt-4 space-y-3">
        {mentorAssignments.map((m) => {
          const mentor = availableMentors.find((a) => a.id === m.mentorId)
          const isEditing = editingId === m.id
          return (
            <div
              key={m.id}
              className="rounded-xl border border-slate-100 px-4 py-3 dark:border-slate-800"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                    {mentor?.label || 'Unknown'}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Assigned {new Date(m.assignedDate).toLocaleDateString('en-GB')}
                    {m.endDate && <> · Ended {new Date(m.endDate).toLocaleDateString('en-GB')}</>}
                  </p>
                  {m.isPrimary && (
                    <span className="ml-2 text-xs font-bold text-amber-600">★ Primary</span>
                  )}
                  {isEditing && (
                    <div className="mt-2 flex flex-col gap-2">
                      <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
                        <input
                          type="checkbox"
                          checked={editPrimary[m.id] || false}
                          onChange={(e) =>
                            setEditPrimary((p) => ({ ...p, [m.id]: e.target.checked }))
                          }
                        />
                        Primary mentor
                      </label>
                      <textarea
                        value={editNotes[m.id] || ''}
                        onChange={(e) => setEditNotes((n) => ({ ...n, [m.id]: e.target.value }))}
                        placeholder="Mentor notes"
                        rows={2}
                        className="w-full rounded-lg border border-slate-200 px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <>
                      <button
                        onClick={() => updateMentor(m.id)}
                        disabled={loading}
                        className="bg-aerojet-blue rounded-lg px-2 py-1 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-bold text-slate-600 dark:border-slate-700 dark:text-slate-300"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => startEdit(m)}
                        className="rounded-lg bg-slate-50 p-2 text-slate-500 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-400"
                        title="Edit mentor"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => removeMentor(m.id)}
                        disabled={loading}
                        className="rounded-lg bg-red-50 p-2 text-red-600 hover:bg-red-100 disabled:opacity-50 dark:bg-red-900/30 dark:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )
        })}
        {mentorAssignments.length === 0 && (
          <p className="text-xs text-slate-400">No mentors assigned yet.</p>
        )}
      </div>
      <div className="mt-4 flex gap-2">
        <select
          value={selectedMentor}
          onChange={(e) => setSelectedMentor(e.target.value)}
          className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs dark:border-slate-800 dark:bg-slate-800 dark:text-white"
        >
          <option value="">Select mentor...</option>
          {availableMentors
            .filter((m) => !mentorAssignments.some((a) => a.mentorId === m.id))
            .map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
        </select>
        <button
          onClick={addMentor}
          disabled={!selectedMentor || loading}
          className="bg-aerojet-blue hover:bg-aerojet-sky rounded-xl px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
        >
          <UserPlus className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
