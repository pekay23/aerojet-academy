'use client'

import { useState, useMemo } from 'react'
import {
  CheckCircle2,
  AlertCircle,
  Users,
  BookOpen,
  Calendar,
  Loader2,
  Check,
  ChevronsUpDown,
} from 'lucide-react'

type AcademicYear = {
  id: string
  name: string
  semesters: { id: string; name: string }[]
}

type Course = {
  id: string
  code: string
  name: string
  category: string | null
}

type Student = {
  id: string
  name: string
  studentId: string
  email: string
  academicYearId: string | null
  semesterId: string | null
}

export default function BatchEnrollForm({
  academicYears,
  courses,
  students,
}: {
  academicYears: AcademicYear[]
  courses: Course[]
  students: Student[]
}) {
  const [selectedYearId, setSelectedYearId] = useState('')
  const [selectedSemesterId, setSelectedSemesterId] = useState('')
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set())
  const [selectedCourseIds, setSelectedCourseIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ created: number; skipped: number } | null>(null)
  const [error, setError] = useState('')

  const selectedYear = academicYears.find((y) => y.id === selectedYearId)
  const semesters = selectedYear?.semesters || []

  // Filter EASA modules for easy "select all"
  const easaModules = useMemo(() => courses.filter((c) => c.category === 'EASA_MODULE'), [courses])
  const otherCourses = useMemo(() => courses.filter((c) => c.category !== 'EASA_MODULE'), [courses])

  const toggleStudent = (id: string) => {
    setSelectedStudentIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleCourse = (id: string) => {
    setSelectedCourseIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const selectAllStudents = () => {
    if (selectedStudentIds.size === students.length) {
      setSelectedStudentIds(new Set())
    } else {
      setSelectedStudentIds(new Set(students.map((s) => s.id)))
    }
  }

  const selectAllEasaModules = () => {
    const easaIds = new Set(easaModules.map((c) => c.id))
    const allSelected = easaModules.every((c) => selectedCourseIds.has(c.id))
    setSelectedCourseIds((prev) => {
      const next = new Set(prev)
      if (allSelected) {
        easaIds.forEach((id) => next.delete(id))
      } else {
        easaIds.forEach((id) => next.add(id))
      }
      return next
    })
  }

  const handleSubmit = async () => {
    if (selectedStudentIds.size === 0 || selectedCourseIds.size === 0) {
      setError('Please select at least one student and one course.')
      return
    }

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const res = await fetch('/api/staff/enrollments/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentIds: Array.from(selectedStudentIds),
          courseIds: Array.from(selectedCourseIds),
          academicYearId: selectedYearId || undefined,
          semesterId: selectedSemesterId || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Something went wrong.')
        return
      }

      setResult({ created: data.created, skipped: data.skipped })
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Academic Period Selector */}
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 dark:text-slate-100">Academic Period</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Optional — link enrollments to a specific semester
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="batch-academic-year"
              className="mb-1 block text-xs font-bold text-slate-500 uppercase dark:text-slate-400"
            >
              Academic Year
            </label>
            <select
              id="batch-academic-year"
              name="batch-academic-year"
              value={selectedYearId}
              onChange={(e) => {
                setSelectedYearId(e.target.value)
                setSelectedSemesterId('')
              }}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              autoComplete="off"
            >
              <option value="">All / None</option>
              {academicYears.map((y) => (
                <option key={y.id} value={y.id}>
                  {y.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="batch-semester"
              className="mb-1 block text-xs font-bold text-slate-500 uppercase dark:text-slate-400"
            >
              Semester
            </label>
            <select
              id="batch-semester"
              name="batch-semester"
              value={selectedSemesterId}
              onChange={(e) => setSelectedSemesterId(e.target.value)}
              disabled={!selectedYearId}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              autoComplete="off"
            >
              <option value="">All / None</option>
              {semesters.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Students Selector */}
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 p-4 sm:p-5 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900 dark:text-slate-100">Full-Time Students</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {selectedStudentIds.size} of {students.length} selected
                </p>
              </div>
            </div>
            <button
              onClick={selectAllStudents}
              className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
            >
              {selectedStudentIds.size === students.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>
          <div className="max-h-[400px] overflow-y-auto p-3 sm:p-4">
            {students.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                No full-time students found.
              </p>
            ) : (
              <div className="space-y-1.5">
                {students.map((student) => {
                  const isSelected = selectedStudentIds.has(student.id)
                  return (
                    <button
                      key={student.id}
                      id={`select-student-${student.id}`}
                      name={`select-student-${student.id}`}
                      role="checkbox"
                      aria-checked={isSelected}
                      aria-label={`Select student ${student.name}`}
                      onClick={() => toggleStudent(student.id)}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all ${
                        isSelected
                          ? 'bg-emerald-50 ring-1 ring-emerald-200 dark:bg-emerald-900/20 dark:ring-emerald-800'
                          : 'hover:bg-white/80 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <div
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md transition-colors ${
                          isSelected
                            ? 'bg-emerald-600 text-white'
                            : 'border border-slate-300 dark:border-slate-600'
                        }`}
                      >
                        {isSelected && <Check className="h-3 w-3" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {student.name}
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                          {student.studentId} • {student.email}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Courses Selector */}
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 p-4 sm:p-5 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900 dark:text-slate-100">Courses</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {selectedCourseIds.size} of {courses.length} selected
                </p>
              </div>
            </div>
            {easaModules.length > 0 && (
              <button
                onClick={selectAllEasaModules}
                className="rounded-lg bg-purple-100 px-3 py-1.5 text-xs font-bold text-purple-600 transition-colors hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-300"
              >
                {easaModules.every((c) => selectedCourseIds.has(c.id))
                  ? 'Deselect EASA'
                  : 'Select All EASA'}
              </button>
            )}
          </div>
          <div className="max-h-[400px] overflow-y-auto p-3 sm:p-4">
            {/* EASA Modules */}
            {easaModules.length > 0 && (
              <div className="mb-4">
                <p className="mb-2 text-[10px] font-black tracking-widest text-slate-400 uppercase dark:text-slate-500">
                  EASA Part-66 Modules
                </p>
                <div className="space-y-1.5">
                  {easaModules.map((course) => {
                    const isSelected = selectedCourseIds.has(course.id)
                    return (
                      <button
                        key={course.id}
                        id={`select-course-${course.id}`}
                        name={`select-course-${course.id}`}
                        role="checkbox"
                        aria-checked={isSelected}
                        aria-label={`Select course ${course.code}`}
                        onClick={() => toggleCourse(course.id)}
                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all ${
                          isSelected
                            ? 'bg-purple-50 ring-1 ring-purple-200 dark:bg-purple-900/20 dark:ring-purple-800'
                            : 'hover:bg-white/80 dark:hover:bg-slate-800/40'
                        }`}
                      >
                        <div
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md transition-colors ${
                            isSelected
                              ? 'bg-purple-600 text-white'
                              : 'border border-slate-300 dark:border-slate-600'
                          }`}
                        >
                          {isSelected && <Check className="h-3 w-3" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {course.code}: {course.name}
                          </p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Other Courses */}
            {otherCourses.length > 0 && (
              <div>
                <p className="mb-2 text-[10px] font-black tracking-widest text-slate-400 uppercase dark:text-slate-500">
                  Other Courses
                </p>
                <div className="space-y-1.5">
                  {otherCourses.map((course) => {
                    const isSelected = selectedCourseIds.has(course.id)
                    return (
                      <button
                        key={course.id}
                        id={`select-course-${course.id}`}
                        name={`select-course-${course.id}`}
                        role="checkbox"
                        aria-checked={isSelected}
                        aria-label={`Select course ${course.code}`}
                        onClick={() => toggleCourse(course.id)}
                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all ${
                          isSelected
                            ? 'bg-purple-50 ring-1 ring-purple-200 dark:bg-purple-900/20 dark:ring-purple-800'
                            : 'hover:bg-white/80 dark:hover:bg-slate-800/40'
                        }`}
                      >
                        <div
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md transition-colors ${
                            isSelected
                              ? 'bg-purple-600 text-white'
                              : 'border border-slate-300 dark:border-slate-600'
                          }`}
                        >
                          {isSelected && <Check className="h-3 w-3" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {course.code}: {course.name}
                          </p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {courses.length === 0 && (
              <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                No active courses found.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Summary & Submit */}
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4 flex flex-wrap items-center gap-3 text-sm">
          <span className="rounded-lg bg-emerald-50 px-3 py-1.5 font-bold text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
            {selectedStudentIds.size} student{selectedStudentIds.size !== 1 ? 's' : ''}
          </span>
          <span className="text-slate-400">×</span>
          <span className="rounded-lg bg-purple-50 px-3 py-1.5 font-bold text-purple-700 dark:bg-purple-900/20 dark:text-purple-300">
            {selectedCourseIds.size} course{selectedCourseIds.size !== 1 ? 's' : ''}
          </span>
          <span className="text-slate-400">=</span>
          <span className="rounded-lg bg-blue-50 px-3 py-1.5 font-black text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
            {selectedStudentIds.size * selectedCourseIds.size} enrollment
            {selectedStudentIds.size * selectedCourseIds.size !== 1 ? 's' : ''}
          </span>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/10 dark:text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {result && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/10 dark:text-emerald-300">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>
              <strong>{result.created}</strong> enrollment{result.created !== 1 ? 's' : ''} created
              {result.skipped > 0 && (
                <>
                  {' '}
                  • <strong>{result.skipped}</strong> skipped (already enrolled)
                </>
              )}
            </span>
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading || selectedStudentIds.size === 0 || selectedCourseIds.size === 0}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-aerojet-blue py-3 text-sm font-bold text-white transition-all hover:bg-[#003a7c] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:px-8"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Activating...
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4" />
              Activate Courses
            </>
          )}
        </button>
      </div>
    </div>
  )
}
