'use client'

import { useState, useEffect, useCallback } from 'react'
import { FileText, Plus, Loader2, Pencil, Trash2, X, Check, StickyNote } from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow, format } from 'date-fns'

interface AdminNote {
  id: string
  content: string
  createdBy: string
  createdAt: string
  updatedAt: string
  authorName: string
}

interface Props {
  student: any
  onRefresh: () => void
  staffId: string
  staffRole: string
}

export default function AdminNotesTab({ student, onRefresh, staffId, staffRole }: Props) {
  const [notes, setNotes] = useState<AdminNote[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [newNote, setNewNote] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const isSuperAdmin = staffRole === 'SUPER_ADMIN'

  const fetchNotes = useCallback(async () => {
    try {
      const res = await fetch(`/api/staff/students/${student.id}/notes`)
      if (res.ok) {
        const data = await res.json()
        setNotes(data.data?.notes || [])
      }
    } catch {
      console.error('Failed to fetch notes')
    } finally {
      setIsLoading(false)
    }
  }, [student.id])

  useEffect(() => {
    fetchNotes()
  }, [fetchNotes])

  const handleAddNote = async () => {
    if (!newNote.trim()) return
    setIsAdding(true)
    try {
      const res = await fetch(`/api/staff/students/${student.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newNote.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to add note')
      toast.success('Note added')
      setNewNote('')
      fetchNotes()
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(err.message)
      } else {
        toast.error('An unexpected error occurred')
      }
    } finally {
      setIsAdding(false)
    }
  }

  const handleUpdateNote = async (noteId: string) => {
    if (!editContent.trim()) return
    try {
      const res = await fetch(`/api/staff/students/${student.id}/notes/${noteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update note')
      toast.success('Note updated')
      setEditingId(null)
      fetchNotes()
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(err.message)
      } else {
        toast.error('An unexpected error occurred')
      }
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    setDeletingId(noteId)
    try {
      const res = await fetch(`/api/staff/students/${student.id}/notes/${noteId}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to delete note')
      toast.success('Note deleted')
      fetchNotes()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setDeletingId(null)
    }
  }

  const canModify = (note: AdminNote) => isSuperAdmin || note.createdBy === staffId

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <StickyNote className="text-aerojet-blue h-5 w-5" />
        <h3 className="text-lg font-semibold">Admin Notes</h3>
        {notes.length > 0 && (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-500 dark:bg-slate-800">
            {notes.length}
          </span>
        )}
      </div>

      {/* Add Note Form */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <label className="mb-2 block text-xs font-bold tracking-wider text-slate-400 uppercase">
          Add a Note
        </label>
        <textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Write a private note about this student..."
          className="focus:border-aerojet-blue focus:ring-aerojet-blue min-h-[100px] w-full rounded-lg border border-slate-200 p-3 text-sm focus:ring-1 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        />
        <div className="mt-3 flex justify-end">
          <button
            onClick={handleAddNote}
            disabled={isAdding || !newNote.trim()}
            className="bg-aerojet-blue flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-[#001d42] disabled:opacity-50"
          >
            {isAdding ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Plus className="h-3.5 w-3.5" />
            )}
            Add Note
          </button>
        </div>
      </div>

      {/* Notes List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      ) : notes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-12 text-center dark:border-slate-700 dark:bg-slate-800/30">
          <FileText className="mx-auto mb-3 h-10 w-10 text-slate-200 dark:text-slate-700" />
          <p className="text-sm font-medium text-slate-400">No notes yet.</p>
          <p className="mt-1 text-xs text-slate-300 dark:text-slate-600">
            Add the first note using the form above.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <div
              key={note.id}
              className="rounded-xl border border-slate-100 bg-white p-4 transition-colors hover:border-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
            >
              {/* Note Header */}
              <div className="mb-2 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-aerojet-blue/10 text-aerojet-blue flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-black uppercase dark:bg-blue-500/10 dark:text-blue-400">
                    {note.authorName
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                      {note.authorName}
                    </p>
                    <p
                      className="text-[10px] text-slate-400"
                      title={format(new Date(note.createdAt), 'PPpp')}
                    >
                      {formatDistanceToNow(new Date(note.createdAt), { addSuffix: true })}
                      {note.updatedAt !== note.createdAt && ' (edited)'}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                {canModify(note) && editingId !== note.id && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingId(note.id)
                        setEditContent(note.content)
                      }}
                      className="rounded-lg p-1.5 text-slate-300 transition-all duration-150 ease-out hover:bg-slate-100 hover:text-slate-500 dark:hover:bg-slate-800/60"
                      title="Edit"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      disabled={deletingId === note.id}
                      className="rounded-lg p-1.5 text-slate-300 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                      title="Delete"
                    >
                      {deletingId === note.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Note Content */}
              {editingId === note.id ? (
                <div className="mt-2">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="focus:border-aerojet-blue focus:ring-aerojet-blue min-h-[80px] w-full rounded-lg border border-slate-200 p-3 text-sm focus:ring-1 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                  <div className="mt-2 flex justify-end gap-2">
                    <button
                      onClick={() => setEditingId(null)}
                      className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-500 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <X className="h-3 w-3" /> Cancel
                    </button>
                    <button
                      onClick={() => handleUpdateNote(note.id)}
                      disabled={!editContent.trim()}
                      className="bg-aerojet-blue flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-[#001d42] disabled:opacity-50"
                    >
                      <Check className="h-3 w-3" /> Save
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm leading-relaxed whitespace-pre-wrap text-slate-600 dark:text-slate-300">
                  {note.content}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
