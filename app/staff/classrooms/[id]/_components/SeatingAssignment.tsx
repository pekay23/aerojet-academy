'use client'

import { useState, useCallback } from 'react'
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
  assignmentId: string
  userId: string
  name: string
  seatId: string | null
  seatLabel: string | null
}

interface LayoutData {
  rows: number
  cols: number
  cells: { row: number; col: number; type: string; label: string | null }[]
}

interface SeatingAssignmentProps {
  classroomId: string
  sittingId?: string
  sittingLabel?: string
  layout: LayoutData
  seats: SeatData[]
  students: StudentData[]
}

export default function SeatingAssignment({
  classroomId,
  sittingId,
  sittingLabel,
  layout,
  seats,
  students: initialStudents,
}: SeatingAssignmentProps) {
  const [students, setStudents] = useState<StudentData[]>(initialStudents)
  const [draggedStudent, setDraggedStudent] = useState<StudentData | null>(null)
  const [saving, setSaving] = useState(false)
  const [showUnassigned, setShowUnassigned] = useState(true)

  const assignedCount = students.filter((s) => s.seatId).length
  const unassignedStudents = students.filter((s) => !s.seatId)
  const totalSeats = seats.length

  const getStudentOnSeat = useCallback(
    (seatId: string) => students.find((s) => s.seatId === seatId),
    [students]
  )

  function handleDragStart(student: StudentData) {
    setDraggedStudent(student)
  }

  function handleDropOnSeat(seat: SeatData) {
    if (!draggedStudent) return

    setStudents((prev) => {
      // Remove student from previous seat
      const updated = prev.map((s) => {
        if (s.assignmentId === draggedStudent.assignmentId) {
          return { ...s, seatId: seat.id, seatLabel: seat.label }
        }
        // If another student was on this seat, unseat them
        if (s.seatId === seat.id) {
          return { ...s, seatId: null, seatLabel: null }
        }
        return s
      })
      return updated
    })
    setDraggedStudent(null)
  }

  function handleRemoveFromSeat(assignmentId: string) {
    setStudents((prev) =>
      prev.map((s) =>
        s.assignmentId === assignmentId ? { ...s, seatId: null, seatLabel: null } : s
      )
    )
  }

  function handleDropOnUnassigned() {
    if (!draggedStudent) return
    handleRemoveFromSeat(draggedStudent.assignmentId)
    setDraggedStudent(null)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const assignments = students.map((s) => ({
        assignmentId: s.assignmentId,
        seatId: s.seatId,
      }))

      const endpoint = sittingId
        ? `/api/staff/exams/sittings/${sittingId}/seats`
        : `/api/staff/classrooms/${classroomId}/seats`

      const res = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignments }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save assignments')
      }

      toast.success('Seating assignments saved', {
        description: `${assignedCount} of ${students.length} students assigned`,
      })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save'
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Stats Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-6 text-sm">
          <span className="font-bold text-slate-900 dark:text-white">{sittingLabel}</span>
          <span className="flex items-center gap-1.5 text-slate-500">
            <Users className="h-4 w-4" />
            {assignedCount}/{students.length} assigned
          </span>
          <span className="flex items-center gap-1.5 text-slate-500">
            <Armchair className="h-4 w-4" />
            {totalSeats - assignedCount} seats available
          </span>
        </div>

        {/* Occupancy bar */}
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
        {/* Unassigned Students Sidebar */}
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
                    key={student.assignmentId}
                    draggable
                    onDragStart={() => handleDragStart(student)}
                    onDragEnd={() => setDraggedStudent(null)}
                    className="hover:border-aerojet-sky flex cursor-grab items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm transition-all hover:bg-indigo-50 active:cursor-grabbing dark:border-slate-700 dark:bg-slate-800 dark:hover:border-indigo-600 dark:hover:bg-indigo-900/20"
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

        {/* Floor Plan View */}
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
                    const cell = layout.cells.find((cell) => cell.row === r && cell.col === c)
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

                    // It's a desk - find the matching seat
                    const seat = seats.find((s) => s.row === r && s.col === c)
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
                              onClick={() => handleRemoveFromSeat(occupant.assignmentId)}
                              className="absolute -top-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-600"
                              style={{ opacity: 1 }}
                              aria-label={`Remove ${occupant.name} from seat ${seat.label}`}
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
