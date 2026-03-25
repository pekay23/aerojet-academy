'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { toast } from 'sonner'
import {
  CalendarDays,
  BookOpen,
  Plus,
  X,
  Check,
  Loader2,
} from 'lucide-react'

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
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AcademicSchedulingPage() {
  const [pathways, setPathways] = useState<Pathway[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedPathwayId, setSelectedPathwayId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // ─── Fetch data ───────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    try {
      const [schedRes, coursesRes] = await Promise.all([
        fetch('/api/staff/academic/scheduling'),
        fetch('/api/staff/courses?limit=500'),
      ])

      if (!schedRes.ok || !coursesRes.ok) {
        throw new Error('Failed to fetch data')
      }

      const schedData = await schedRes.json()
      const coursesData = await coursesRes.json()

      const pw: Pathway[] = schedData.data?.pathways ?? schedData.pathways ?? []
      setPathways(pw)

      const cl: Course[] =
        coursesData.data?.items ?? coursesData.data ?? coursesData.items ?? []
      setCourses(cl)

      if (pw.length > 0 && !selectedPathwayId) {
        setSelectedPathwayId(pw[0].id)
      }
    } catch (err) {
      toast.error('Failed to load scheduling data')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [selectedPathwayId])

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ─── Derived state ────────────────────────────────────────────────────────

  const selectedPathway = useMemo(
    () => pathways.find((p) => p.id === selectedPathwayId) ?? null,
    [pathways, selectedPathwayId]
  )

  // Build ordered columns: Year X / Sem Y
  const termColumns = useMemo(() => {
    if (!selectedPathway) return []
    return [...selectedPathway.academicTerms].sort((a, b) =>
      a.yearNumber !== b.yearNumber
        ? a.yearNumber - b.yearNumber
        : a.semesterNumber - b.semesterNumber
    )
  }, [selectedPathway])

  // Build assignment lookup: "termId-courseId" -> assignmentId
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

  // Sort courses naturally
  const sortedCourses = useMemo(() => {
    const collator = new Intl.Collator(undefined, {
      numeric: true,
      sensitivity: 'base',
    })
    return [...courses].sort((a, b) => collator.compare(a.code, b.code))
  }, [courses])

  // Count assignments per term column
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
      await fetchData()
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to assign course')
    } finally {
      setActionLoading(null)
    }
  }

  const handleRemove = async (termId: string, courseId: string) => {
    const confirmed = window.confirm(
      'Remove this course from the term? This cannot be undone.'
    )
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
      await fetchData()
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

  // ─── Loading state ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-aerojet-sky" />
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Loading scheduling data...
          </p>
        </div>
      </div>
    )
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-[1600px] space-y-8 px-4 py-8 md:px-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <CalendarDays className="h-8 w-8 text-aerojet-sky" />
          <h1 className="text-3xl font-bold tracking-tight text-aerojet-blue dark:text-white">
            Academic Scheduling
          </h1>
        </div>
        <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">
          Manage course assignments by semester and year for each study pathway
        </p>
      </div>

      {/* Pathway selector */}
      <div className="flex flex-wrap gap-3">
        {pathways.map((p) => (
          <button
            key={p.id}
            onClick={() => setSelectedPathwayId(p.id)}
            className={`rounded-xl border px-6 py-3 text-sm font-bold transition-all ${
              selectedPathwayId === p.id
                ? 'border-aerojet-blue bg-aerojet-blue text-white shadow-lg'
                : 'border-slate-200 bg-white text-aerojet-blue hover:border-aerojet-sky hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-aerojet-sky'
            }`}
          >
            {p.name}
          </button>
        ))}
      </div>

      {/* Empty state */}
      {!selectedPathway && (
        <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center dark:border-slate-800 dark:bg-slate-900">
          <BookOpen className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" />
          <p className="mt-4 text-lg font-bold text-slate-400 dark:text-slate-500">
            No pathway selected
          </p>
          <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">
            Select a study pathway above to view and manage course assignments.
          </p>
        </div>
      )}

      {/* No terms state */}
      {selectedPathway && termColumns.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center dark:border-slate-800 dark:bg-slate-900">
          <CalendarDays className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" />
          <p className="mt-4 text-lg font-bold text-slate-400 dark:text-slate-500">
            No academic terms defined
          </p>
          <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">
            This pathway has no terms configured yet. Add terms via the
            scheduling settings.
          </p>
        </div>
      )}

      {/* Scheduling grid */}
      {selectedPathway && termColumns.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              {/* Header */}
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50">
                  <th className="sticky left-0 z-20 min-w-[280px] border-r border-slate-200 bg-slate-50 px-6 py-5 text-left text-sm font-bold text-aerojet-blue dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-300">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-aerojet-sky" />
                      Course
                    </div>
                  </th>
                  {termColumns.map((term) => (
                    <th
                      key={term.id}
                      className="min-w-[140px] border-r border-slate-200 px-4 py-5 text-center dark:border-slate-800"
                    >
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-sm font-bold text-aerojet-blue dark:text-slate-100">
                          Year {term.yearNumber}
                        </span>
                        <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-aerojet-blue dark:bg-blue-900/30 dark:text-blue-300">
                          Sem {term.semesterNumber}
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              {/* Body */}
              <tbody>
                {sortedCourses.map((course) => (
                  <tr
                    key={course.id}
                    className="group border-b border-slate-100 transition-all duration-150 ease-out hover:bg-white/80 dark:border-slate-800/50 dark:hover:bg-slate-800/40"
                  >
                    {/* Course name column */}
                    <td className="sticky left-0 z-10 border-r border-slate-200 bg-white px-6 py-4 transition-all duration-150 ease-out group-hover:bg-white dark:border-slate-800 dark:bg-slate-900 dark:group-hover:bg-slate-800/40">
                      <div className="space-y-1">
                        <div className="text-sm font-bold leading-tight text-aerojet-blue dark:text-slate-100">
                          {course.name}
                        </div>
                        <span className="inline-block rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                          {course.code}
                        </span>
                      </div>
                    </td>

                    {/* Term cells */}
                    {termColumns.map((term) => {
                      const key = `${term.id}-${course.id}`
                      const isAssigned = assignmentMap.has(key)
                      const isCellLoading = actionLoading === key

                      return (
                        <td
                          key={key}
                          className={`border-r border-slate-100 p-0 text-center dark:border-slate-800/50 ${
                            isAssigned
                              ? 'bg-emerald-50/50 dark:bg-emerald-900/10'
                              : ''
                          }`}
                        >
                          <button
                            onClick={() =>
                              handleCellClick(term.id, course.id)
                            }
                            disabled={!!actionLoading}
                            className={`flex h-full min-h-[56px] w-full items-center justify-center transition-all ${
                              actionLoading && actionLoading !== key
                                ? 'cursor-not-allowed opacity-50'
                                : 'cursor-pointer'
                            } ${
                              isAssigned
                                ? 'hover:bg-red-50 dark:hover:bg-red-900/10'
                                : 'hover:bg-blue-50/50 dark:hover:bg-blue-900/10'
                            }`}
                            title={
                              isAssigned
                                ? 'Click to remove assignment'
                                : 'Click to assign course'
                            }
                          >
                            {isCellLoading ? (
                              <Loader2 className="h-5 w-5 animate-spin text-aerojet-sky" />
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

                {sortedCourses.length === 0 && (
                  <tr>
                    <td
                      colSpan={termColumns.length + 1}
                      className="py-16 text-center"
                    >
                      <BookOpen className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600" />
                      <p className="mt-3 text-sm font-bold text-slate-400">
                        No courses found
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>

              {/* Footer: totals */}
              <tfoot>
                <tr className="border-t border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50">
                  <td className="sticky left-0 z-10 border-r border-slate-200 bg-slate-50 px-6 py-4 text-sm font-bold text-aerojet-blue dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-300">
                    Total courses per term
                  </td>
                  {termColumns.map((term) => (
                    <td
                      key={term.id}
                      className="border-r border-slate-200 px-4 py-4 text-center dark:border-slate-800"
                    >
                      <span className="inline-flex min-w-[28px] items-center justify-center rounded-lg bg-aerojet-blue px-2 py-1 text-xs font-bold text-white">
                        {termCounts[term.id] ?? 0}
                      </span>
                    </td>
                  ))}
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
