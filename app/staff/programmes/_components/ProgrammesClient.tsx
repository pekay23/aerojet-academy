'use client'

import { useState } from 'react'
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
import {
  Plus,
  Loader2,
  GraduationCap,
  ChevronDown,
  ChevronRight,
  Users,
  Calendar,
} from 'lucide-react'

export interface ProgrammeSemester {
  name: string
  startDate: string
  endDate: string
}

interface ProgrammeYear {
  id: string
  yearNumber: number
  yearFeeAmount: string | null
  seatConfirmationFee: string
  firstPaymentAmount: string
  semesters: ProgrammeSemester[]
  isActive: boolean
}

interface Programme {
  id: string
  code: string
  name: string
  durationYears: number
  totalFee: string
  currency: string
  description: string | null
  isActive: boolean
  programmeYears: ProgrammeYear[]
  _count: { enrollments: number }
}

export default function ProgrammesClient({ programmes }: { programmes: Programme[] }) {
  const router = useRouter()
  const [createOpen, setCreateOpen] = useState(false)
  const [yearOpen, setYearOpen] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Create programme form
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [durationYears, setDurationYears] = useState('4')
  const [totalFee, setTotalFee] = useState('')
  const [description, setDescription] = useState('')

  // Add/Edit year form
  const [yearProgrammeId, setYearProgrammeId] = useState('')
  const [editingYearId, setEditingYearId] = useState<string | null>(null)
  const [yearNumber, setYearNumber] = useState('')
  const [yearFee, setYearFee] = useState('')
  const [seatFee, setSeatFee] = useState('1500')
  const [firstPayment, setFirstPayment] = useState('3500')
  const [semesters, setSemesters] = useState<ProgrammeSemester[]>([
    { name: 'Semester 1', startDate: '', endDate: '' },
    { name: 'Semester 2', startDate: '', endDate: '' },
  ])

  const handleCreateProgramme = async () => {
    if (!code || !name || !totalFee) {
      setError('Code, name, and total fee are required')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/staff/programmes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, name, durationYears, totalFee, description }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create')
      setCreateOpen(false)
      setCode('')
      setName('')
      setTotalFee('')
      setDescription('')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const openAddYear = (programmeId: string) => {
    setEditingYearId(null)
    setYearProgrammeId(programmeId)
    const prog = programmes.find((p) => p.id === programmeId)
    const nextYear = (prog?.programmeYears.length || 0) + 1
    setYearNumber(String(nextYear))
    setYearFee('')
    setSeatFee('1500')
    setFirstPayment('3500')
    setSemesters([
      { name: 'Semester 1', startDate: '', endDate: '' },
      { name: 'Semester 2', startDate: '', endDate: '' },
    ])
    setError('')
    setYearOpen(true)
  }

  const openEditYear = (programmeId: string, year: ProgrammeYear) => {
    setEditingYearId(year.id)
    setYearProgrammeId(programmeId)
    setYearNumber(String(year.yearNumber))
    setYearFee(year.yearFeeAmount || '')
    setSeatFee(year.seatConfirmationFee)
    setFirstPayment(year.firstPaymentAmount)
    setSemesters(
      year.semesters && year.semesters.length > 0
        ? [...year.semesters]
        : [
            { name: 'Semester 1', startDate: '', endDate: '' },
            { name: 'Semester 2', startDate: '', endDate: '' },
          ]
    )
    setError('')
    setYearOpen(true)
  }

  const handleSaveYear = async () => {
    if (semesters.some((s) => !s.startDate || !s.endDate)) {
      setError('All semesters must have start and end dates')
      return
    }
    setLoading(true)
    setError('')
    try {
      const isEditing = !!editingYearId
      const url = isEditing
        ? `/api/staff/programmes/${yearProgrammeId}/years`
        : `/api/staff/programmes/${yearProgrammeId}/years`

      const method = isEditing ? 'PATCH' : 'POST'

      const body = {
        ...(isEditing ? { yearId: editingYearId } : { yearNumber }),
        yearFeeAmount: yearFee || null,
        seatConfirmationFee: seatFee,
        firstPaymentAmount: firstPayment,
        semesters: semesters,
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save year')
      setYearOpen(false)
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAddSemester = () => {
    setSemesters([
      ...semesters,
      { name: `Semester ${semesters.length + 1}`, startDate: '', endDate: '' },
    ])
  }

  const handleRemoveSemester = (index: number) => {
    setSemesters(semesters.filter((_, i) => i !== index))
  }

  const handleSemesterChange = (index: number, field: keyof ProgrammeSemester, value: string) => {
    const newSemesters = [...semesters]
    newSemesters[index] = { ...newSemesters[index], [field]: value }
    setSemesters(newSemesters)
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-aerojet-blue dark:text-white">
            Full-Time Programmes
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Manage programme structures, fees, and year configurations
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Add Programme
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle>Create Programme</DialogTitle>
              <DialogDescription className="sr-only">
                Enter the details for a new full-time training programme.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="prog-code" className="mb-1 block text-xs font-bold text-slate-600">Code</label>
                  <input
                    id="prog-code"
                    name="code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="FT_4Y_B1B2"
                    autoComplete="off"
                    className="w-full rounded-md border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label htmlFor="prog-duration" className="mb-1 block text-xs font-bold text-slate-600">
                    Duration (years)
                  </label>
                  <input
                    id="prog-duration"
                    name="durationYears"
                    type="number"
                    value={durationYears}
                    onChange={(e) => setDurationYears(e.target.value)}
                    autoComplete="off"
                    className="w-full rounded-md border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="prog-name" className="mb-1 block text-xs font-bold text-slate-600">Name</label>
                <input
                  id="prog-name"
                  name="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full-Time 4-Year B1+B2"
                  autoComplete="off"
                  className="w-full rounded-md border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
              <div>
                <label htmlFor="prog-fee" className="mb-1 block text-xs font-bold text-slate-600">Total Fee</label>
                <input
                  id="prog-fee"
                  name="totalFee"
                  type="number"
                  value={totalFee}
                  onChange={(e) => setTotalFee(e.target.value)}
                  placeholder="32000"
                  autoComplete="off"
                  className="w-full rounded-md border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
              <div>
                <label htmlFor="prog-desc" className="mb-1 block text-xs font-bold text-slate-600">Description</label>
                <textarea
                  id="prog-desc"
                  name="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  autoComplete="off"
                  className="w-full rounded-md border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
            </div>
            <div className="mt-4 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={loading}>
                Cancel
              </Button>
              <Button onClick={handleCreateProgramme} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Programme List */}
      <div className="space-y-4">
        {programmes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-12 text-center dark:border-slate-800">
            <GraduationCap className="mx-auto mb-3 h-10 w-10 text-slate-300" />
            <p className="font-bold text-slate-500">No programmes configured yet</p>
          </div>
        ) : (
          programmes.map((prog) => {
            const isExpanded = expandedId === prog.id
            return (
              <div
                key={prog.id}
                className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900"
              >
                <button
                  onClick={() => setExpandedId(isExpanded ? null : prog.id)}
                  className="flex w-full items-center justify-between p-6 text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/20">
                      <GraduationCap className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-400">
                          {prog.code}
                        </span>
                        {!prog.isActive && (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-500">
                            Inactive
                          </span>
                        )}
                      </div>
                      <p className="text-lg font-black text-slate-800 dark:text-white">
                        {prog.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {prog.durationYears} year{prog.durationYears !== 1 ? 's' : ''} &middot;{' '}
                        {prog.currency} {Number(prog.totalFee).toLocaleString()} &middot;{' '}
                        <Users className="inline h-3 w-3" /> {prog._count.enrollments} enrolled
                      </p>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="h-5 w-5 text-slate-400" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-slate-400" />
                  )}
                </button>

                {isExpanded && (
                  <div className="border-t border-slate-200 px-6 pt-4 pb-6 dark:border-slate-700">
                    {prog.description && (
                      <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
                        {prog.description}
                      </p>
                    )}

                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-xs font-black tracking-widest text-slate-400 uppercase">
                        Programme Years
                      </h3>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1 text-xs"
                        onClick={() => openAddYear(prog.id)}
                      >
                        <Plus className="h-3 w-3" /> Add Year
                      </Button>
                    </div>

                    {prog.programmeYears.length === 0 ? (
                      <p className="text-sm text-slate-400 italic">
                        No years configured. Add years to define semester schedules and fees.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {prog.programmeYears.map((y) => (
                          <div
                            key={y.id}
                            className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50"
                          >
                            <div className="flex items-center gap-3">
                              <Calendar className="h-4 w-4 text-blue-500" />
                              <div>
                                <p className="font-bold text-slate-700 dark:text-slate-200">
                                  Year {y.yearNumber}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {y.semesters && y.semesters.length > 0
                                    ? y.semesters.map((sem, i) => (
                                        <span key={i}>
                                          {sem.name}:{' '}
                                          {sem.startDate
                                            ? new Date(sem.startDate).toLocaleDateString()
                                            : ''}
                                          {i < y.semesters.length - 1 ? ' · ' : ''}
                                        </span>
                                      ))
                                    : 'No semesters defined'}
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2 text-right text-xs text-slate-500">
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-2 text-xs"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    openEditYear(prog.id, y)
                                  }}
                                >
                                  Edit Year
                                </Button>
                              </div>
                              <div>
                                <p>
                                  Fee: {prog.currency}{' '}
                                  {y.yearFeeAmount
                                    ? Number(y.yearFeeAmount).toLocaleString()
                                    : 'Auto'}
                                </p>
                                <p>
                                  Seat: {prog.currency}{' '}
                                  {Number(y.seatConfirmationFee).toLocaleString()} &middot; 1st:{' '}
                                  {prog.currency} {Number(y.firstPaymentAmount).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Add/Edit Year Dialog */}
      <Dialog open={yearOpen} onOpenChange={setYearOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>
              {editingYearId ? 'Edit Programme Year' : 'Add Programme Year'}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Configure the schedule and fees for a specific year of the programme.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="year-num" className="mb-1 block text-xs font-bold text-slate-600">Year Number</label>
                <input
                  id="year-num"
                  name="yearNumber"
                  type="number"
                  value={yearNumber}
                  onChange={(e) => setYearNumber(e.target.value)}
                  disabled={!!editingYearId}
                  autoComplete="off"
                  className="w-full rounded-md border px-3 py-2 text-sm disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
              <div>
                <label htmlFor="year-fee" className="mb-1 block text-xs font-bold text-slate-600">
                  Year Fee (optional)
                </label>
                <input
                  id="year-fee"
                  name="yearFee"
                  type="number"
                  value={yearFee}
                  onChange={(e) => setYearFee(e.target.value)}
                  placeholder="Auto from total"
                  autoComplete="off"
                  className="w-full rounded-md border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="year-seat" className="mb-1 block text-xs font-bold text-slate-600">
                  Seat Confirmation Fee
                </label>
                <input
                  id="year-seat"
                  name="seatFee"
                  type="number"
                  value={seatFee}
                  onChange={(e) => setYearFee(e.target.value)}
                  autoComplete="off"
                  className="w-full rounded-md border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
              <div>
                <label htmlFor="year-1st" className="mb-1 block text-xs font-bold text-slate-600">First Payment</label>
                <input
                  id="year-1st"
                  name="firstPayment"
                  type="number"
                  value={firstPayment}
                  onChange={(e) => setFirstPayment(e.target.value)}
                  autoComplete="off"
                  className="w-full rounded-md border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
            </div>

            <div className="pt-2">
              <div className="mb-2 flex items-center justify-between">
                <label htmlFor="sem-name-0" className="block text-xs font-bold text-slate-600">Semesters</label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleAddSemester}
                  className="h-6 px-2 text-xs"
                >
                  + Add Semester
                </Button>
              </div>
              <div className="max-h-48 space-y-3 overflow-y-auto pr-1">
                {semesters.map((sem, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:bg-slate-800/50"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <input
                        id={`sem-name-${idx}`}
                        name={`semester-name-${idx}`}
                        autoComplete="off"
                        className="w-32 border-b border-dashed border-slate-300 bg-transparent text-xs font-bold outline-none"
                        value={sem.name}
                        onChange={(e) => handleSemesterChange(idx, 'name', e.target.value)}
                      />
                      <button
                        onClick={() => handleRemoveSemester(idx)}
                        className="text-xs text-red-500 hover:text-red-600"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label htmlFor={`sem-start-${idx}`} className="text-xs text-slate-500">Start</label>
                        <input
                          id={`sem-start-${idx}`}
                          name={`semester-start-${idx}`}
                          type="date"
                          value={sem.startDate ? sem.startDate.split('T')[0] : ''}
                          onChange={(e) => handleSemesterChange(idx, 'startDate', e.target.value)}
                          autoComplete="off"
                          className="w-full rounded-md border px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-800"
                        />
                      </div>
                      <div>
                        <label htmlFor={`sem-end-${idx}`} className="text-xs text-slate-500">End</label>
                        <input
                          id={`sem-end-${idx}`}
                          name={`semester-end-${idx}`}
                          type="date"
                          value={sem.endDate ? sem.endDate.split('T')[0] : ''}
                          onChange={(e) => handleSemesterChange(idx, 'endDate', e.target.value)}
                          autoComplete="off"
                          className="w-full rounded-md border px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-800"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
          <div className="mt-4 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setYearOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleSaveYear} disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : editingYearId ? (
                'Save Changes'
              ) : (
                'Add Year'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
