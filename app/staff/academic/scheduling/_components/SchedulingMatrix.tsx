'use client'

import { useState, useMemo, useCallback } from 'react'
import { toast } from 'sonner'
import { CalendarDays, BookOpen, Plus, X, Check, Loader2, Search } from 'lucide-react'
import { compareNatural } from '@/lib/utils/natural-sort'
import { Button } from '@/components/ui/button'

// ─── Types ────────────────────────────────────────────────────────────────────

interface CourseRef {
  id: string
  code: string
  name: string
}

interface TermCourseAssignment {
  id: string
  termId: string
  courseId: string
  course: CourseRef
}

interface AcademicTerm {
  id: string
  pathwayId: string
  yearNumber: number
  semesterNumber: number
  courseAssignments: TermCourseAssignment[]
}

interface Pathway {
  id: string
  code: string
  name: string
  academicTerms: AcademicTerm[]
}

interface Course {
  id: string
  code: string
  name: string
  isActive: boolean
  duration: number | null
}

interface SchedulingMatrixProps {
  initialPathways: Pathway[]
  initialCourses: Course[]
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SchedulingMatrix({
  initialPathways,
  initialCourses,
}: SchedulingMatrixProps) {
  const [pathways, setPathways] = useState<Pathway[]>(initialPathways)
  const [courses] = useState<Course[]>(initialCourses)
  const [selectedPathwayId, setSelectedPathwayId] = useState<string>(initialPathways[0]?.id ?? '')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Mobile specific state
  const [isMobileSidebarExpanded, setIsMobileSidebarExpanded] = useState(false)

  // ─── Refetch after mutations ──────────────────────────────────────────────

  const refetchPathways = useCallback(async () => {
    try {
      const res = await fetch('/api/staff/academic/scheduling')
      if (!res.ok) throw new Error('Failed to refresh')
      const data = await res.json()
      setPathways(data.data?.pathways ?? data.pathways ?? [])
    } catch {
      // Silent — data will be stale but user already saw the toast
    }
  }, [])

  // ─── Derived state ────────────────────────────────────────────────────────

  const selectedPathway = useMemo(
    () => pathways.find((p) => p.id === selectedPathwayId) ?? null,
    [pathways, selectedPathwayId]
  )

  const termColumns = useMemo(() => {
    if (!selectedPathway) return []
    return [...selectedPathway.academicTerms].sort((a, b) =>
      a.yearNumber !== b.yearNumber
        ? a.yearNumber - b.yearNumber
        : a.semesterNumber - b.semesterNumber
    )
  }, [selectedPathway])

  const assignmentMap = useMemo(() => {
    const map = new Map<string, string>()
    if (!selectedPathway) return map
    for (const term of selectedPathway.academicTerms) {
      for (const a of term.courseAssignments) {
        map.set(`${term.id}-${a.courseId}`, a.id)
      }
    }
    return map
  }, [selectedPathway])

  const sortedCourses = useMemo(() => {
    return [...courses].sort((a, b) => compareNatural(a.code, b.code))
  }, [courses])

  const termCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const term of termColumns) {
      counts[term.id] = term.courseAssignments.length
    }
    return counts
  }, [termColumns])

  // ─── Actions ──────────────────────────────────────────────────────────────

  const handleAssign = async (termId: string, courseId: string) => {
    const key = `${termId}-${courseId}`
    setActionLoading(key)
    try {
      const res = await fetch('/api/staff/academic/scheduling', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ termId, courseId }),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error ?? 'Failed to assign course')
      }
      toast.success('Course assigned to term')
      await refetchPathways()
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to assign course')
    } finally {
      setActionLoading(null)
    }
  }

  const handleRemove = async (termId: string, courseId: string) => {
    const confirmed = window.confirm('Remove this course from the term? This cannot be undone.')
    if (!confirmed) return

    const key = `${termId}-${courseId}`
    setActionLoading(key)
    try {
      const res = await fetch(
        `/api/staff/academic/scheduling?termId=${termId}&courseId=${courseId}`,
        { method: 'DELETE' }
      )
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error ?? 'Failed to remove assignment')
      }
      toast.success('Course removed from term')
      await refetchPathways()
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to remove assignment')
    } finally {
      setActionLoading(null)
    }
  }

  const handleCellClick = (termId: string, courseId: string) => {
    const key = `${termId}-${courseId}`
    if (actionLoading) return
    if (assignmentMap.has(key)) {
      handleRemove(termId, courseId)
    } else {
      handleAssign(termId, courseId)
    }
  }

  return (
    <div className="mx-auto max-w-[1800px] space-y-6 px-4 py-8 md:space-y-8 md:px-8">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <CalendarDays className="text-aerojet-sky h-7 w-7 md:h-8 md:w-8" />
          <h1 className="text-aerojet-blue text-2xl font-black tracking-tight md:text-3xl dark:text-white">
            Academic Scheduling
          </h1>
        </div>
        <p className="text-xs font-medium text-slate-500 md:text-sm dark:text-slate-400">
          Manage course assignments by semester and year for each study pathway
        </p>
      </div>

      {/* Pathway selector */}
      <div className="flex flex-wrap gap-2">
        {pathways.map((p) => (
          <button
            key={p.id}
            onClick={() => setSelectedPathwayId(p.id)}
            className={`rounded-xl border px-4 py-2 text-xs font-bold transition-all md:px-6 md:py-3 md:text-sm ${
              selectedPathwayId === p.id
                ? 'border-aerojet-blue bg-aerojet-blue text-white shadow-lg'
                : 'text-aerojet-blue hover:border-aerojet-sky dark:hover:border-aerojet-sky border-slate-200 bg-white hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200'
            }`}
          >
            {p.name}
          </button>
        ))}
      </div>

      {!selectedPathway && (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center md:p-16 dark:border-slate-800 dark:bg-slate-900">
          <BookOpen className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" />
          <p className="mt-4 text-lg font-bold text-slate-400 dark:text-slate-500">
            No pathway selected
          </p>
        </div>
      )}

      {selectedPathway && termColumns.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center md:p-16 dark:border-slate-800 dark:bg-slate-900">
          <CalendarDays className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" />
          <p className="mt-4 text-lg font-bold text-slate-400 dark:text-slate-500">
            No academic terms defined
          </p>
        </div>
      )}

      {selectedPathway && termColumns.length > 0 && (
        <div className="space-y-6">
          {/* ── Desktop View (Matrix) ────────────────────────────────────────── */}
          <div className="hidden md:block">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50">
                      <th className="sticky left-0 z-20 w-[180px] min-w-[180px] border-r border-slate-200 bg-slate-50 px-4 py-5 text-left text-[11px] font-black tracking-wider text-slate-500 uppercase shadow-[2px_0_5px_rgba(0,0,0,0.05)] dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-400">
                        <div className="flex items-center gap-2">
                          <BookOpen className="text-aerojet-sky h-3.5 w-3.5" />
                          Course
                        </div>
                      </th>
                      {termColumns.map((term) => (
                        <th
                          key={term.id}
                          className="min-w-[120px] border-r border-slate-200 px-4 py-5 text-center dark:border-slate-800"
                        >
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-aerojet-blue text-sm font-bold dark:text-slate-100">
                              Year {term.yearNumber}
                            </span>
                            <span className="text-aerojet-blue rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase dark:bg-blue-900/30 dark:text-blue-300">
                              Sem {term.semesterNumber}
                            </span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedCourses.map((course) => (
                      <tr
                        key={course.id}
                        className="group border-b border-slate-100 transition-all duration-150 ease-out hover:bg-white/80 dark:border-slate-800/50 dark:hover:bg-slate-800/40"
                      >
                        <td className="sticky left-0 z-10 w-[180px] border-r border-slate-200 bg-white px-4 py-3 shadow-[2px_0_5px_rgba(0,0,0,0.05)] transition-all duration-150 ease-out group-hover:bg-white dark:border-slate-800 dark:bg-slate-900 dark:group-hover:bg-slate-800/40">
                          <div className="space-y-0.5">
                            <div
                              className="text-aerojet-blue truncate text-xs leading-tight font-bold dark:text-slate-100"
                              title={course.name}
                            >
                              {course.name}
                            </div>
                            <span className="inline-block rounded bg-slate-100 px-1 py-0.5 font-mono text-[9px] font-black tracking-tighter text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                              {course.code}
                            </span>
                          </div>
                        </td>
                        {termColumns.map((term) => {
                          const key = `${term.id}-${course.id}`
                          const isAssigned = assignmentMap.has(key)
                          const isCellLoading = actionLoading === key
                          return (
                            <td
                              key={key}
                              className={`border-r border-slate-100 p-0 text-center dark:border-slate-800/50 ${isAssigned ? 'bg-emerald-50/50 dark:bg-emerald-900/10' : ''}`}
                            >
                              <button
                                onClick={() => handleCellClick(term.id, course.id)}
                                disabled={!!actionLoading}
                                aria-label={
                                  isAssigned
                                    ? `Remove ${course.code} from Year ${term.yearNumber} Sem ${term.semesterNumber}`
                                    : `Assign ${course.code} to Year ${term.yearNumber} Sem ${term.semesterNumber}`
                                }
                                className={`flex h-full min-h-[56px] w-full items-center justify-center transition-all ${actionLoading && actionLoading !== key ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} ${isAssigned ? 'hover:bg-red-50 dark:hover:bg-red-900/10' : 'hover:bg-blue-50/50 dark:hover:bg-blue-900/10'}`}
                              >
                                {isCellLoading ? (
                                  <Loader2 className="text-aerojet-sky h-5 w-5 animate-spin" />
                                ) : isAssigned ? (
                                  <div className="group/cell flex items-center justify-center">
                                    <Check className="h-5 w-5 text-emerald-500 group-hover/cell:hidden" />
                                    <X className="hidden h-5 w-5 text-red-400 group-hover/cell:block" />
                                  </div>
                                ) : (
                                  <Plus className="h-4 w-4 text-slate-300 opacity-0 transition-opacity group-hover:opacity-100 dark:text-slate-600" />
                                )}
                              </button>
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50">
                      <td className="sticky left-0 z-10 w-[180px] border-r border-slate-200 bg-slate-50 px-4 py-4 text-[10px] font-black tracking-wider text-slate-500 uppercase shadow-[2px_0_5px_rgba(0,0,0,0.05)] dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-400">
                        Total courses
                      </td>
                      {termColumns.map((term) => (
                        <td
                          key={term.id}
                          className="border-r border-slate-200 px-4 py-4 text-center dark:border-slate-800"
                        >
                          <span className="bg-aerojet-blue inline-flex min-w-[28px] items-center justify-center rounded-lg px-2 py-1 text-xs font-bold text-white">
                            {termCounts[term.id] ?? 0}
                          </span>
                        </td>
                      ))}
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>

          {/* ── Mobile Optimized Matrix ─────────────────────────────────────── */}
          <div className="block md:hidden">
            <div className="relative overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
              {/* Mobile Table Actions */}
              <div className="flex items-center justify-between border-b border-slate-50 bg-slate-50/30 px-4 py-3 dark:border-slate-800/50">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsMobileSidebarExpanded(!isMobileSidebarExpanded)}
                  className="text-aerojet-blue h-8 rounded-xl px-3 text-[10px] font-black tracking-widest uppercase shadow-sm transition-all active:scale-95"
                >
                  {isMobileSidebarExpanded ? 'Hide Names' : 'Show Names'}
                </Button>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                    Swipe for Terms →
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 dark:bg-slate-900/80">
                      <th
                        className={`sticky left-0 z-20 border-r border-slate-100 bg-white px-2 py-4 text-center shadow-[4px_0_8px_rgba(0,0,0,0.04)] transition-all duration-300 dark:border-slate-800 dark:bg-slate-900 ${isMobileSidebarExpanded ? 'w-[160px]' : 'w-[65px]'}`}
                      >
                        <div className="flex flex-col items-center gap-1">
                          <BookOpen className="text-aerojet-sky h-3.5 w-3.5" />
                          <span className="text-[9px] font-black tracking-tighter text-slate-400 uppercase">
                            Mod
                          </span>
                        </div>
                      </th>
                      {termColumns.map((term) => (
                        <th
                          key={term.id}
                          className="min-w-[85px] border-r border-slate-50 px-2 py-3 text-center dark:border-slate-800"
                        >
                          <div className="flex flex-col items-center">
                            <span className="text-aerojet-blue text-[10px] font-black dark:text-slate-100">
                              Y{term.yearNumber}
                            </span>
                            <span className="text-[9px] font-bold text-slate-400">
                              S{term.semesterNumber}
                            </span>
                            <div className="mt-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-slate-100 px-1 text-[8px] font-black dark:bg-slate-800">
                              {termCounts[term.id] ?? 0}
                            </div>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedCourses.map((course) => (
                      <tr
                        key={`mobile-${course.id}`}
                        className="border-b border-slate-50 dark:border-slate-800/50"
                      >
                        <td
                          className={`sticky left-0 z-10 border-r border-slate-100 bg-white p-2 shadow-[4px_0_8px_rgba(0,0,0,0.04)] transition-all duration-300 dark:border-slate-800 dark:bg-slate-900 ${isMobileSidebarExpanded ? 'w-[160px]' : 'w-[65px]'}`}
                        >
                          <div className="flex flex-col items-center space-y-1">
                            {isMobileSidebarExpanded && (
                              <div className="text-aerojet-blue animate-in fade-in mb-1 line-clamp-2 text-center text-[10px] leading-tight font-black duration-300 dark:text-slate-100">
                                {course.name}
                              </div>
                            )}
                            <span className="bg-aerojet-blue/5 text-aerojet-blue rounded px-1.5 py-0.5 font-mono text-[10px] font-black dark:bg-blue-900/20 dark:text-blue-300">
                              {course.code}
                            </span>
                            <span className="text-[9px] font-bold text-slate-400 tabular-nums">
                              {course.duration ? `${course.duration}h` : '--h'}
                            </span>
                          </div>
                        </td>
                        {termColumns.map((term) => {
                          const key = `${term.id}-${course.id}`
                          const isAssigned = assignmentMap.has(key)
                          const isCellLoading = actionLoading === key
                          return (
                            <td
                              key={`mobile-cell-${key}`}
                              className={`border-r border-slate-50 p-0 text-center dark:border-slate-800/50 ${isAssigned ? 'bg-emerald-50/30 dark:bg-emerald-900/5' : ''}`}
                            >
                              <button
                                onClick={() => handleCellClick(term.id, course.id)}
                                disabled={!!actionLoading}
                                aria-label={
                                  isAssigned
                                    ? `Remove ${course.code} from Y${term.yearNumber} S${term.semesterNumber}`
                                    : `Assign ${course.code} to Y${term.yearNumber} S${term.semesterNumber}`
                                }
                                className="flex h-[72px] w-full items-center justify-center active:bg-slate-50 dark:active:bg-slate-800"
                              >
                                {isCellLoading ? (
                                  <Loader2 className="text-aerojet-sky h-4 w-4 animate-spin" />
                                ) : isAssigned ? (
                                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500 text-white shadow-sm transition-transform active:scale-125">
                                    <Check className="h-3.5 w-3.5 stroke-3" />
                                  </div>
                                ) : (
                                  <div className="flex h-6 w-6 items-center justify-center rounded-lg border border-slate-100 text-slate-200 dark:border-slate-800 dark:text-slate-700">
                                    <Plus className="h-3.5 w-3.5" />
                                  </div>
                                )}
                              </button>
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Footer Tip */}
            <div className="mt-4 flex flex-col items-center gap-2 text-center">
              <div className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800">
                <Search className="h-3 w-3 text-slate-400" />
                <span className="text-[10px] font-bold text-slate-500">
                  Tap modules to assign/remove
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
