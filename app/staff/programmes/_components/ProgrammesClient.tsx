'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
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

interface ProgrammeYear {
  id: string
  yearNumber: number
  yearFeeAmount: string | null
  seatConfirmationFee: string
  firstPaymentAmount: string
  semester1StartDate: string
  semester2StartDate: string
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

  // Add year form
  const [yearProgrammeId, setYearProgrammeId] = useState('')
  const [yearNumber, setYearNumber] = useState('')
  const [yearFee, setYearFee] = useState('')
  const [seatFee, setSeatFee] = useState('1500')
  const [firstPayment, setFirstPayment] = useState('3500')
  const [sem1Start, setSem1Start] = useState('')
  const [sem2Start, setSem2Start] = useState('')

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
    setYearProgrammeId(programmeId)
    const prog = programmes.find((p) => p.id === programmeId)
    const nextYear = (prog?.programmeYears.length || 0) + 1
    setYearNumber(String(nextYear))
    setYearFee('')
    setSeatFee('1500')
    setFirstPayment('3500')
    setSem1Start('')
    setSem2Start('')
    setError('')
    setYearOpen(true)
  }

  const handleAddYear = async () => {
    if (!sem1Start || !sem2Start) {
      setError('Semester start dates are required')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/staff/programmes/${yearProgrammeId}/years`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          yearNumber,
          yearFeeAmount: yearFee || null,
          seatConfirmationFee: seatFee,
          firstPaymentAmount: firstPayment,
          semester1StartDate: sem1Start,
          semester2StartDate: sem2Start,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to add year')
      setYearOpen(false)
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[#002a5c] dark:text-white">
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
            </DialogHeader>
            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-600">Code</label>
                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="FT_4Y_B1B2"
                    className="w-full rounded-md border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-600">Duration (years)</label>
                  <input
                    type="number"
                    value={durationYears}
                    onChange={(e) => setDurationYears(e.target.value)}
                    className="w-full rounded-md border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-600">Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full-Time 4-Year B1+B2"
                  className="w-full rounded-md border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-600">Total Fee (EUR)</label>
                <input
                  type="number"
                  value={totalFee}
                  onChange={(e) => setTotalFee(e.target.value)}
                  placeholder="32000"
                  className="w-full rounded-md border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-600">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
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
                className="rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
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
                        <span className="font-mono text-xs font-bold text-slate-400">{prog.code}</span>
                        {!prog.isActive && (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                            Inactive
                          </span>
                        )}
                      </div>
                      <p className="text-lg font-black text-slate-800 dark:text-white">{prog.name}</p>
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
                  <div className="border-t border-slate-100 px-6 pb-6 pt-4 dark:border-slate-800">
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
                            className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50"
                          >
                            <div className="flex items-center gap-3">
                              <Calendar className="h-4 w-4 text-blue-500" />
                              <div>
                                <p className="font-bold text-slate-700 dark:text-slate-200">
                                  Year {y.yearNumber}
                                </p>
                                <p className="text-xs text-slate-500">
                                  Sem 1: {new Date(y.semester1StartDate).toLocaleDateString()} &middot;
                                  Sem 2: {new Date(y.semester2StartDate).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="text-right text-xs text-slate-500">
                              <p>
                                Fee: &euro;{y.yearFeeAmount ? Number(y.yearFeeAmount).toLocaleString() : 'Auto'}
                              </p>
                              <p>
                                Seat: &euro;{Number(y.seatConfirmationFee).toLocaleString()} &middot;
                                1st: &euro;{Number(y.firstPaymentAmount).toLocaleString()}
                              </p>
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

      {/* Add Year Dialog */}
      <Dialog open={yearOpen} onOpenChange={setYearOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Add Programme Year</DialogTitle>
          </DialogHeader>
          <div className="mt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-600">Year Number</label>
                <input
                  type="number"
                  value={yearNumber}
                  onChange={(e) => setYearNumber(e.target.value)}
                  className="w-full rounded-md border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-600">Year Fee (optional)</label>
                <input
                  type="number"
                  value={yearFee}
                  onChange={(e) => setYearFee(e.target.value)}
                  placeholder="Auto from total"
                  className="w-full rounded-md border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-600">Seat Confirmation Fee</label>
                <input
                  type="number"
                  value={seatFee}
                  onChange={(e) => setSeatFee(e.target.value)}
                  className="w-full rounded-md border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-600">First Payment</label>
                <input
                  type="number"
                  value={firstPayment}
                  onChange={(e) => setFirstPayment(e.target.value)}
                  className="w-full rounded-md border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-600">Semester 1 Start</label>
                <input
                  type="date"
                  value={sem1Start}
                  onChange={(e) => setSem1Start(e.target.value)}
                  className="w-full rounded-md border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-600">Semester 2 Start</label>
                <input
                  type="date"
                  value={sem2Start}
                  onChange={(e) => setSem2Start(e.target.value)}
                  className="w-full rounded-md border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
          <div className="mt-4 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setYearOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleAddYear} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add Year'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
