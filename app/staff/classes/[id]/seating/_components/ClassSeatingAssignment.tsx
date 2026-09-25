'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import {
  Save,
  Loader2,
  User,
  Users,
  GripVertical,
  X,
  Armchair,
  Ban,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface SeatData {
  id: string
  row: number
  col: number
  label: string | null
  isEnabled: boolean
}

interface StudentData {
  id: string
  name: string
}

interface LayoutData {
  rows: number
  cols: number
  cells: { row: number; col: number; type: string; label: string | null }[]
}

interface ClassSeatingAssignmentProps {
  classId: string
  classroomId: string
  layout: LayoutData
  seats: SeatData[]
  students: StudentData[]
}

export default function ClassSeatingAssignment({
  classId,
  classroomId: _classroomId,
  layout,
  seats,
  students,
}: ClassSeatingAssignmentProps) {
  // assignments: { seatId: userId }
  const [assignments, setAssignments] = useState<Record<string, string>>({})
  const [draggedStudent, setDraggedStudent] = useState<StudentData | null>(null)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showUnassigned, setShowUnassigned] = useState(true)

  // Load existing assignments
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/staff/classes/${classId}/seating`)
        if (res.ok) {
          const data = await res.json()
          setAssignments(data.assignments || {})
        }
      } catch {
        /* ignore */
      }
      setLoading(false)
    }
    load()
  }, [classId])

  const assignedStudentIds = new Set(Object.values(assignments))
  const unassignedStudents = students.filter((s) => !assignedStudentIds.has(s.id))
  const assignedCount = assignedStudentIds.size

  const studentById = useMemo(() => {
    const map = new Map<string, StudentData>()
    for (const s of students) map.set(s.id, s)
    return map
  }, [students])

  const cellMap = useMemo(() => {
    const map = new Map<string, { row: number; col: number; type: string; label: string | null }>()
    for (const c of layout.cells) map.set(`${c.row}-${c.col}`, c)
    return map
  }, [layout.cells])

  const seatMap = useMemo(() => {
    const map = new Map<string, SeatData>()
    for (const s of seats) map.set(`${s.row}-${s.col}`, s)
    return map
  }, [seats])

  const getStudentOnSeat = useCallback(
    (seatId: string) => {
      const userId = assignments[seatId]
      return userId ? studentById.get(userId) : undefined
    },
    [assignments, studentById]
  )

  function handleDropOnSeat(seat: SeatData) {
    if (!draggedStudent) return
    setAssignments((prev) => {
      const next = { ...prev }
      // Remove student from any previous seat
      for (const [sId, uId] of Object.entries(next)) {
        if (uId === draggedStudent.id) delete next[sId]
      }
      // Remove any existing occupant of this seat
      delete next[seat.id]
      // Assign
      next[seat.id] = draggedStudent.id
      return next
    })
    setDraggedStudent(null)
  }

  function handleRemoveFromSeat(seatId: string) {
    setAssignments((prev) => {
      const next = { ...prev }
      delete next[seatId]
      return next
    })
  }

  function handleDropOnUnassigned() {
    if (!draggedStudent) return
    setAssignments((prev) => {
      const next = { ...prev }
      for (const [sId, uId] of Object.entries(next)) {
        if (uId === draggedStudent.id) delete next[sId]
      }
      return next
    })
    setDraggedStudent(null)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch(`/api/staff/classes/${classId}/seating`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignments }),
      })
      if (!res.ok) throw new Error('Failed to save')
      toast.success('Seating assignments saved', {
        description: `${assignedCount} of ${students.length} students assigned`,
      })
    } catch {
      toast.error('Failed to save seating assignments')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-6 text-sm">
          <span className="flex items-center gap-1.5 text-slate-500">
            <Users className="h-4 w-4" />
            {assignedCount}/{students.length} assigned
          </span>
          <span className="flex items-center gap-1.5 text-slate-500">
            <Armchair className="h-4 w-4" />
            {seats.length - assignedCount} seats available
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-2 w-32 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                assignedCount === students.length
                  ? 'bg-emerald-500'
                  : assignedCount > 0
                    ? 'bg-aerojet-sky'
                    : 'bg-slate-300'
              )}
              style={{
                width: `${students.length > 0 ? (assignedCount / students.length) * 100 : 0}%`,
              }}
            />
          </div>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="bg-aerojet-blue hover:bg-aerojet-sky"
          >
            {saving ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="mr-1.5 h-3.5 w-3.5" />
            )}
            Save
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        {/* Unassigned students sidebar */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <button
            onClick={() => setShowUnassigned(!showUnassigned)}
            className="flex w-full items-center justify-between p-4"
          >
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Unassigned ({unassignedStudents.length})
            </h3>
            {showUnassigned ? (
              <ChevronUp className="h-4 w-4 text-slate-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-slate-400" />
            )}
          </button>

          {showUnassigned && (
            <div
              className="max-h-125 space-y-1 overflow-y-auto border-t border-slate-100 p-2 dark:border-slate-800"
              onDragOver={(e) => {
                e.preventDefault()
                e.dataTransfer.dropEffect = 'move'
              }}
              onDrop={(e) => {
                e.preventDefault()
                handleDropOnUnassigned()
              }}
            >
              {unassignedStudents.length === 0 ? (
                <p className="p-3 text-center text-xs text-slate-400">All students assigned!</p>
              ) : (
                unassignedStudents.map((student) => (
                  <div
                    key={student.id}
                    draggable
                    onDragStart={() => setDraggedStudent(student)}
                    onDragEnd={() => setDraggedStudent(null)}
                    className="hover:border-aerojet-sky flex cursor-grab items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm transition-all hover:bg-indigo-50 active:cursor-grabbing dark:border-slate-700 dark:bg-slate-800 dark:hover:border-indigo-600"
                  >
                    <GripVertical className="h-3.5 w-3.5 shrink-0 text-slate-300" />
                    <User className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <span className="truncate font-medium text-slate-700 dark:text-slate-300">
                      {student.name}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Floor plan */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
          <div className="flex justify-center">
            <div className="space-y-2">
              <div className="mb-4 flex items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white/50 px-6 py-2 dark:border-slate-700 dark:bg-slate-900/50">
                <span className="text-xs font-bold tracking-widest text-slate-400 uppercase">
                  Front of Room
                </span>
              </div>

              <div
                className="grid gap-1.5"
                style={{
                  gridTemplateColumns: `repeat(${layout.cols}, minmax(0, 1fr))`,
                }}
              >
                {Array.from({ length: layout.rows }, (_, r) =>
                  Array.from({ length: layout.cols }, (_, c) => {
                    const cell = cellMap.get(`${r}-${c}`)
                    const type = cell?.type ?? 'AISLE'

                    if (type !== 'DESK') {
                      return (
                        <div
                          key={`${r}-${c}`}
                          className={cn(
                            'flex h-14 w-14 items-center justify-center rounded-lg border sm:h-16 sm:w-16',
                            type === 'OBSTACLE'
                              ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
                              : 'border-transparent'
                          )}
                        >
                          {type === 'OBSTACLE' && <Ban className="h-4 w-4 text-red-300" />}
                        </div>
                      )
                    }

                    const seat = seatMap.get(`${r}-${c}`)
                    if (!seat)
                      return <div key={`${r}-${c}`} className="h-14 w-14 sm:h-16 sm:w-16" />

                    const occupant = getStudentOnSeat(seat.id)
                    const isDropTarget = draggedStudent && !occupant

                    return (
                      <div
                        key={`${r}-${c}`}
                        onDragOver={(e) => {
                          if (draggedStudent) {
                            e.preventDefault()
                            e.dataTransfer.dropEffect = 'move'
                          }
                        }}
                        onDrop={(e) => {
                          e.preventDefault()
                          handleDropOnSeat(seat)
                        }}
                        className={cn(
                          'relative flex h-14 w-14 flex-col items-center justify-center rounded-lg border transition-all sm:h-16 sm:w-16',
                          occupant
                            ? 'border-indigo-300 bg-indigo-100 dark:border-indigo-700 dark:bg-indigo-900/30'
                            : isDropTarget
                              ? 'border-aerojet-sky ring-aerojet-sky/30 border-dashed bg-indigo-50 ring-2 dark:bg-indigo-900/10'
                              : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800'
                        )}
                      >
                        <span className="text-[9px] font-bold text-slate-400">{seat.label}</span>
                        {occupant ? (
                          <>
                            <span
                              className="max-w-12 truncate text-[9px] font-bold text-indigo-700 sm:max-w-14 dark:text-indigo-400"
                              title={occupant.name}
                            >
                              {occupant.name.split(' ')[0]}
                            </span>
                            <button
                              onClick={() => handleRemoveFromSeat(seat.id)}
                              className="absolute -top-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600"
                              aria-label={`Remove occupant from seat ${seat.label}`}
                              title="Remove from seat"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </>
                        ) : (
                          <Armchair className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600" />
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
