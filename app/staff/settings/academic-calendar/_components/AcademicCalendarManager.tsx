'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus,
  Edit2,
  Trash2,
  Calendar,
  MoreVertical,
  Layers,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

type Semester = {
  id: string
  name: string
  academicYearId: string
  startDate: Date | string
  endDate: Date | string
  isActive: boolean
}

type AcademicYear = {
  id: string
  name: string
  startDate: Date | string
  endDate: Date | string
  isActive: boolean
  semesters: Semester[]
  _count: { classes: number }
}

export default function AcademicCalendarManager({
  initialYears,
}: {
  initialYears: AcademicYear[]
}) {
  const router = useRouter()
  const [years, setYears] = useState<AcademicYear[]>(initialYears)

  // Handlers for Add/Edit
  const [editingYear, setEditingYear] = useState<AcademicYear | null>(null)
  const [editingSemester, setEditingSemester] = useState<{
    sem: Semester | null
    yearId: string
  } | null>(null)
  const [isYearModalOpen, setYearModalOpen] = useState(false)
  const [isSemModalOpen, setSemModalOpen] = useState(false)

  const [isLoading, setIsLoading] = useState(false)

  // Submits Year form
  const handleYearSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    const formData = new FormData(e.currentTarget)
    const payload = {
      name: formData.get('name') as string,
      startDate: formData.get('startDate') as string,
      endDate: formData.get('endDate') as string,
      isActive: formData.get('isActive') === 'on',
    }

    try {
      const isEdit = !!editingYear?.id
      const url = isEdit
        ? `/api/staff/academic-years/${editingYear.id}`
        : '/api/staff/academic-years'
      const method = isEdit ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error((await res.json()).error)

      setYearModalOpen(false)
      router.refresh()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  // Submits Semester form
  const handleSemesterSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    const formData = new FormData(e.currentTarget)
    const payload = {
      name: formData.get('name') as string,
      academicYearId: editingSemester?.yearId,
      startDate: formData.get('startDate') as string,
      endDate: formData.get('endDate') as string,
      isActive: formData.get('isActive') === 'on',
    }

    try {
      const isEdit = !!editingSemester?.sem?.id
      const url = isEdit ? `/api/staff/semesters/${editingSemester!.sem!.id}` : '/api/staff/semesters'
      const method = isEdit ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error((await res.json()).error)

      setSemModalOpen(false)
      router.refresh()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteYear = async (id: string) => {
    if (!confirm('Are you sure you want to delete this Academic Year?')) return
    try {
      const res = await fetch(`/api/staff/academic-years/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error((await res.json()).error)
      router.refresh()
    } catch (err: any) {
      alert(err.message)
    }
  }

  const handleDeleteSemester = async (id: string) => {
    if (!confirm('Are you sure you want to delete this Semester?')) return
    try {
      const res = await fetch(`/api/staff/semesters/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error((await res.json()).error)
      router.refresh()
    } catch (err: any) {
      alert(err.message)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div>
          <h2 className="text-sm font-bold tracking-widest text-aerojet-blue uppercase dark:text-blue-400">
            Control Panel
          </h2>
          <p className="mt-1 text-xs text-slate-500">Add or manage global academic entities.</p>
        </div>
        <Button
          onClick={() => {
            setEditingYear(null)
            setYearModalOpen(true)
          }}
          className="rounded-xl bg-blue-600 px-5 text-xs font-bold text-white shadow-md hover:bg-blue-700"
        >
          <Plus className="mr-2 h-4 w-4" /> New Academic Year
        </Button>
      </div>

      <div className="grid gap-6">
        {initialYears.map((year) => (
          <div
            key={year.id}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            {/* Year Header */}
            <div className="flex flex-col items-center justify-between border-b border-slate-200 bg-slate-50 p-6 sm:flex-row dark:border-slate-800 dark:bg-slate-800/50">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                  <Calendar className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="flex items-center gap-2 text-xl font-bold text-slate-800 dark:text-slate-100">
                    {year.name}
                    {year.isActive ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold tracking-widest text-emerald-700 uppercase">
                        Active
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold tracking-widest text-slate-600 uppercase dark:bg-slate-700 dark:text-slate-400">
                        Inactive
                      </span>
                    )}
                  </h3>
                  <p className="text-xs font-medium text-slate-500">
                    {new Date(year.startDate).toLocaleDateString()} —{' '}
                    {new Date(year.endDate).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex gap-2 sm:mt-0">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl border-slate-200 bg-white text-slate-600 transition-all duration-150 ease-out hover:border-slate-300 hover:shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600"
                  onClick={() => {
                    setEditingSemester({ sem: null, yearId: year.id })
                    setSemModalOpen(true)
                  }}
                >
                  <Plus className="mr-1 h-4 w-4" /> Add Semester
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingYear(year)
                    setYearModalOpen(true)
                  }}
                  className="rounded-xl border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-900/10"
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteYear(year.id)}
                  disabled={year._count.classes > 0}
                  className="rounded-xl border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Semesters List */}
            <div className="p-6">
              {year.semesters.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center dark:border-slate-700 dark:bg-slate-800/30">
                  <Layers className="mx-auto mb-2 h-8 w-8 text-slate-300 dark:text-slate-600" />
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    No semesters added yet.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {year.semesters.map((sem) => (
                    <div
                      key={sem.id}
                      className="rounded-xl border border-slate-100 bg-white p-4 transition-all hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800"
                    >
                      <div className="mb-2 flex items-start justify-between">
                        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                          {sem.name}
                        </h4>
                        <div className="flex gap-1">
                          <button
                            onClick={() => {
                              setEditingSemester({ sem, yearId: year.id })
                              setSemModalOpen(true)
                            }}
                            className="p-1 text-slate-400 transition-colors hover:text-blue-500"
                          >
                            <Edit2 className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteSemester(sem.id)}
                            className="p-1 text-slate-400 transition-colors hover:text-red-500"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                      <p className="mb-2 flex items-center gap-2 text-xs text-slate-500">
                        {new Date(sem.startDate).toLocaleDateString()} —{' '}
                        {new Date(sem.endDate).toLocaleDateString()}
                      </p>
                      {sem.isActive ? (
                        <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          <CheckCircle className="h-3 w-3" /> Active
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-xs font-bold text-slate-500 dark:text-slate-400">
                          <XCircle className="h-3 w-3" /> Inactive
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Year Modal */}
      <Dialog open={isYearModalOpen} onOpenChange={setYearModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingYear ? 'Edit Academic Year' : 'Create Academic Year'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleYearSubmit} className="mt-4 space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Name</label>
              <input
                required
                name="name"
                defaultValue={editingYear?.name}
                placeholder="2026/2027"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Start Date
                </label>
                <input
                  required
                  type="date"
                  name="startDate"
                  defaultValue={
                    editingYear?.startDate
                      ? new Date(editingYear.startDate).toISOString().split('T')[0]
                      : ''
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  End Date
                </label>
                <input
                  required
                  type="date"
                  name="endDate"
                  defaultValue={
                    editingYear?.endDate
                      ? new Date(editingYear.endDate).toISOString().split('T')[0]
                      : ''
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                name="isActive"
                id="isActive"
                defaultChecked={editingYear ? editingYear.isActive : true}
              />
              <label
                htmlFor="isActive"
                className="text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Is Active
              </label>
            </div>
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-xl bg-aerojet-blue text-white hover:bg-blue-800"
            >
              {isLoading ? 'Saving...' : 'Save Year'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Semester Modal */}
      <Dialog open={isSemModalOpen} onOpenChange={setSemModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingSemester?.sem ? 'Edit Semester' : 'Add Semester'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSemesterSubmit} className="mt-4 space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Semester Name
              </label>
              <input
                required
                name="name"
                defaultValue={editingSemester?.sem?.name}
                placeholder="Semester 1"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Start Date
                </label>
                <input
                  required
                  type="date"
                  name="startDate"
                  defaultValue={
                    editingSemester?.sem?.startDate
                      ? new Date(editingSemester.sem.startDate).toISOString().split('T')[0]
                      : ''
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  End Date
                </label>
                <input
                  required
                  type="date"
                  name="endDate"
                  defaultValue={
                    editingSemester?.sem?.endDate
                      ? new Date(editingSemester.sem.endDate).toISOString().split('T')[0]
                      : ''
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                name="isActive"
                id="semIsActive"
                defaultChecked={editingSemester?.sem ? editingSemester.sem.isActive : true}
              />
              <label
                htmlFor="semIsActive"
                className="text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Is Active
              </label>
            </div>
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-xl bg-blue-600 text-white hover:bg-blue-700"
            >
              {isLoading ? 'Saving...' : 'Save Semester'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
