'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Edit2, Loader2, GraduationCap } from 'lucide-react'
import { useFormDirty } from '@/hooks/useFormDirty'

interface AcademicYear {
  id: string
  name: string
  semesters: { id: string; name: string }[]
}

export default function EditAcademicPeriodDialog({
  userId,
  currentAcademicYearId,
  currentAcademicYearName,
  currentSemesterId,
  currentSemesterName,
}: {
  userId: string
  currentAcademicYearId?: string | null
  currentAcademicYearName?: string | null
  currentSemesterId?: string | null
  currentSemesterName?: string | null
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [academicYearId, setAcademicYearId] = useState(currentAcademicYearId || '')
  const [semesterId, setSemesterId] = useState(currentSemesterId || '')
  const [error, setError] = useState<string | null>(null)

  const { markDirty, markClean } = useFormDirty()

  // Fetched data
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
  const [loadingYears, setLoadingYears] = useState(false)

  // Fetch active academic years when dialog opens
  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoadingYears(true)
      fetch('/api/staff/academic-years')
        .then((res) => res.json())
        .then((data) => {
          setAcademicYears(Array.isArray(data) ? data : data.academicYears || [])
        })
        .catch((err) => {
          console.error('[EditAcademicPeriodDialog] Failed to fetch academic years:', err)
          setError('Failed to load academic years')
          setAcademicYears([])
        })
        .finally(() => setLoadingYears(false))
    }
  }, [open])

  // Get semesters for the selected academic year
  const selectedYear = academicYears.find((y) => y.id === academicYearId)
  const semesters = selectedYear?.semesters || []

  // Reset semester when academic year changes
  const handleYearChange = (yearId: string) => {
    setAcademicYearId(yearId)
    setSemesterId('') // Always reset semester when year changes
    setError(null)
    markDirty()
  }

  // Clear both if academic year is cleared
  const handleClearYear = () => {
    setAcademicYearId('')
    setSemesterId('')
    setError(null)
    markDirty()
  }

  const hasChanges =
    academicYearId !== (currentAcademicYearId || '') || semesterId !== (currentSemesterId || '')

  const handleSave = async () => {
    // Validate: can't have semester without academic year
    if (semesterId && !academicYearId) {
      setError('You must select an academic year before choosing a semester.')
      return
    }

    setIsSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`/api/staff/students/${userId}/academic-period`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          academicYearId: academicYearId || null,
          semesterId: semesterId || null,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update academic period')
      }

      markClean()
      setOpen(false)
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update academic period')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="ml-2 text-slate-400 hover:text-blue-500">
          <Edit2 className="h-4 w-4" />
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-110">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="text-aerojet-sky h-5 w-5" />
            Edit Academic Period
          </DialogTitle>
          <DialogDescription className="sr-only">
            Select the current academic year and semester for this student.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Assign the student&apos;s current academic year and semester. Semester options update
            automatically based on the selected year.
          </p>

          {/* Academic Year */}
          <div className="space-y-2">
            <label
              htmlFor="academic-year-select"
              className="text-sm font-bold text-slate-700 dark:text-slate-300"
            >
              Academic Year <span className="text-red-500">*</span>
            </label>
            {loadingYears ? (
              <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-400 dark:border-slate-700 dark:bg-slate-800">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading academic years...
              </div>
            ) : academicYears.length === 0 ? (
              <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:border-amber-800/50 dark:bg-amber-900/10 dark:text-amber-300">
                No active academic years found. Please create one in Academic Settings first.
              </div>
            ) : (
              <select
                id="academic-year-select"
                name="academicYearId"
                value={academicYearId}
                onChange={(e) =>
                  e.target.value ? handleYearChange(e.target.value) : handleClearYear()
                }
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800"
                autoComplete="off"
              >
                <option value="">— Select Academic Year —</option>
                {academicYears.map((year) => (
                  <option key={year.id} value={year.id}>
                    {year.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Semester — only visible when academic year is selected */}
          <div
            className={`space-y-2 transition-all duration-200 ${
              academicYearId ? 'opacity-100' : 'pointer-events-none opacity-40'
            }`}
          >
            <label
              htmlFor="semester-select"
              className="text-sm font-bold text-slate-700 dark:text-slate-300"
            >
              Semester
            </label>
            {semesters.length === 0 && academicYearId ? (
              <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:border-amber-800/50 dark:bg-amber-900/10 dark:text-amber-300">
                No semesters found for this academic year.
              </div>
            ) : (
              <select
                id="semester-select"
                name="semesterId"
                value={semesterId}
                onChange={(e) => {
                  setSemesterId(e.target.value)
                  setError(null)
                  markDirty()
                }}
                disabled={!academicYearId}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800"
                autoComplete="off"
              >
                <option value="">— Select Semester —</option>
                {semesters.map((sem) => (
                  <option key={sem.id} value={sem.id}>
                    {sem.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Current Assignment Summary */}
          {(currentAcademicYearName || currentSemesterName) && (
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/40">
              <p className="mb-1 text-xs font-bold tracking-wider text-slate-400 uppercase">
                Current Assignment
              </p>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                {currentAcademicYearName || 'None'}
                {currentSemesterName && ` — ${currentSemesterName}`}
              </p>
            </div>
          )}

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        </div>

        <div className="mt-4 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSubmitting || !hasChanges || !academicYearId}>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Academic Period'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
