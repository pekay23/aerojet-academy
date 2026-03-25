'use client'

import { useState, useMemo } from 'react'
import { toast } from 'sonner'
import { Loader2, ShoppingCart, AlertCircle, Wallet, X } from 'lucide-react'

const BOOKING_TYPES = [
  { value: 'INDIVIDUAL', label: 'Single Exam', modules: 1, desc: 'Individual exam seat' },
  { value: 'TWIN_PACK', label: 'Twin Pack', modules: 2, desc: '2 exams bundled' },
  { value: 'FOUR_PACK', label: '4-Pack Bundle', modules: 4, desc: '4 exams bundled' },
  { value: 'RESIT', label: 'Resit', modules: 1, desc: 'Re-sit a failed exam' },
] as const

const ATTEMPT_TYPES = [
  { value: 'FIRST', label: '1st Attempt' },
  { value: 'RESIT_1', label: 'Resit (2nd)' },
  { value: 'RESIT_2', label: 'Resit (3rd)' },
  { value: 'RESIT_3', label: 'Resit (4th+)' },
]

// Default prices — will be overridden by backend
const DEFAULT_PRICES: Record<string, number> = {
  INDIVIDUAL: 520,
  TWIN_PACK: 980,
  FOUR_PACK: 1900,
  RESIT: 480,
}

interface Props {
  studentId: string
  studentName: string
  walletBalance: number
  walletCurrency: string
  enrollmentType?: string | null
  academicYears?: { id: string; name: string }[]
  semesters?: { id: string; name: string }[]
  examComponents: {
    id: string
    code: string
    name: string
    course?: { id: string; name: string; code: string }
  }[]
  upcomingEvents: {
    id: string
    name: string
    startDate: string
    endDate: string
  }[]
  onSuccess: () => void
}

export default function BookExamForStudentDialog({
  studentId,
  studentName,
  walletBalance,
  walletCurrency,
  enrollmentType,
  academicYears,
  semesters,
  examComponents,
  upcomingEvents,
  onSuccess,
}: Props) {
  const isFullTime = enrollmentType === 'FULL_TIME'
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const [bookingType, setBookingType] = useState<string>('INDIVIDUAL')
  const [selectedModules, setSelectedModules] = useState<string[]>([])
  const [eventId, setEventId] = useState<string>('')
  const [examDate, setExamDate] = useState<string>('')
  const [academicYearId, setAcademicYearId] = useState<string>('')
  const [semesterId, setSemesterId] = useState<string>('')
  const [paymentMethod, setPaymentMethod] = useState<'AUTO_DEBIT' | 'MANUAL_LATER'>('AUTO_DEBIT')
  const [attemptType, setAttemptType] = useState<string>('FIRST')
  const [notes, setNotes] = useState<string>('')

  const selectedType = BOOKING_TYPES.find((t) => t.value === bookingType)!
  const price = DEFAULT_PRICES[bookingType] || 520
  const canAfford = walletBalance >= price

  // Deduplicate by code and naturally sort exam components
  const sortedExamComponents = useMemo(() => {
    const seenCourse = new Set<string>()
    return examComponents
      .filter((ec) => {
        const courseId = ec.course?.id || ec.id
        if (seenCourse.has(courseId)) return false
        seenCourse.add(courseId)
        return true
      })
      .sort((a, b) => {
        const codeA = a.code || ''
        const codeB = b.code || ''
        const numA = parseInt(codeA.replace(/\D/g, '') || '0', 10)
        const numB = parseInt(codeB.replace(/\D/g, '') || '0', 10)
        if (numA && numB) return numA - numB
        return codeA.localeCompare(codeB)
      })
  }, [examComponents])

  const toggleModule = (id: string) => {
    setSelectedModules((prev) => {
      if (prev.includes(id)) return prev.filter((m) => m !== id)
      if (prev.length >= selectedType.modules) return prev
      return [...prev, id]
    })
  }

  const handleSubmit = async () => {
    if (selectedModules.length !== selectedType.modules) {
      toast.error(`Please select exactly ${selectedType.modules} module(s)`)
      return
    }

    // For full-time students, allow academic calendar instead of exam date
    // For others, require exam event or date
    const hasAcademicInfo = isFullTime && academicYearId && semesterId
    const hasExamInfo = eventId || examDate

    if (!hasAcademicInfo && !hasExamInfo) {
      if (isFullTime) {
        toast.error('Please select an academic calendar (year & semester) or an exam event/date')
      } else {
        toast.error('Please select an exam event or enter an exam date')
      }
      return
    }

    if (paymentMethod === 'AUTO_DEBIT' && !canAfford) {
      toast.error('Insufficient wallet balance for auto-debit')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/staff/students/${studentId}/book-exam`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingType,
          moduleIds: selectedModules,
          eventId: eventId || undefined,
          examDate: examDate || undefined,
          academicYearId: academicYearId || undefined,
          semesterId: semesterId || undefined,
          paymentMethod,
          attemptType: bookingType === 'RESIT' ? attemptType : 'FIRST',
          notes,
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        toast.error(data.error || 'Failed to book exam')
        return
      }

      toast.success(
        `Exam booked successfully! ${paymentMethod === 'AUTO_DEBIT' ? `€${price} debited from wallet.` : 'Payment pending.'}`
      )
      setOpen(false)
      resetForm()
      onSuccess()
    } catch (err) {
      toast.error('Failed to book exam. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setBookingType('INDIVIDUAL')
    setSelectedModules([])
    setEventId('')
    setExamDate('')
    setAcademicYearId('')
    setSemesterId('')
    setPaymentMethod('AUTO_DEBIT')
    setAttemptType('FIRST')
    setNotes('')
  }

  return (
    <>
      {/* Trigger button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-aerojet-blue px-4 py-2 text-xs font-bold text-white transition-all hover:bg-[#001f45]"
        >
          <ShoppingCart className="h-3.5 w-3.5" />
          Book Exam
        </button>
      )}

      {/* Modal Overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl dark:bg-slate-900">
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4 dark:border-slate-800 dark:bg-slate-900">
              <div>
                <h2 className="text-lg font-black text-slate-800 dark:text-white">
                  Book Exam for {studentName}
                </h2>
                <p className="text-xs text-slate-400">
                  Wallet: {walletCurrency} {walletBalance.toFixed(2)}
                </p>
              </div>
              <button
                onClick={() => {
                  setOpen(false)
                  resetForm()
                }}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-6 p-6">
              {/* Step 1: Booking Type */}
              <div>
                <label className="mb-2 block text-xs font-black tracking-widest text-slate-400 uppercase">
                  Booking Type
                </label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {BOOKING_TYPES.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => {
                        setBookingType(type.value)
                        setSelectedModules([])
                        if (type.value === 'RESIT') setAttemptType('RESIT_1')
                        else setAttemptType('FIRST')
                      }}
                      className={`rounded-xl border p-3 text-left transition-all ${
                        bookingType === type.value
                          ? 'border-aerojet-blue bg-aerojet-blue/5 ring-1 ring-aerojet-blue'
                          : 'border-slate-200 hover:border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        {type.label}
                      </div>
                      <div className="text-[10px] text-slate-400">{type.desc}</div>
                      <div className="mt-1 text-sm font-black text-aerojet-blue">
                        €{DEFAULT_PRICES[type.value]}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 2: Select Modules */}
              <div>
                <label className="mb-2 block text-xs font-black tracking-widest text-slate-400 uppercase">
                  Select Module{selectedType.modules > 1 ? 's' : ''} ({selectedModules.length}/
                  {selectedType.modules})
                </label>
                <div className="grid max-h-48 grid-cols-1 gap-1.5 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-2 dark:border-slate-700 dark:bg-slate-800/50">
                  {sortedExamComponents.map((comp) => {
                    const isSelected = selectedModules.includes(comp.id)
                    const isFull = selectedModules.length >= selectedType.modules && !isSelected
                    return (
                      <button
                        key={comp.id}
                        onClick={() => toggleModule(comp.id)}
                        disabled={isFull}
                        className={`rounded-lg border px-3 py-2 text-left text-xs transition-all ${
                          isSelected
                            ? 'border-aerojet-blue bg-aerojet-blue/10 font-bold text-aerojet-blue'
                            : isFull
                              ? 'cursor-not-allowed border-slate-100 bg-slate-100/50 text-slate-300'
                              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900'
                        }`}
                      >
                        <span className="font-mono font-bold">
                          {comp.course?.code || comp.code}
                        </span>
                        <span className="ml-1.5 text-slate-400">
                          {comp.course?.name || comp.name}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Step 3: Academic Calendar (Full-Time Students Only) */}
              {isFullTime && academicYears && academicYears.length > 0 && (
                <div>
                  <label className="mb-2 block text-xs font-black tracking-widest text-slate-400 uppercase">
                    Academic Calendar (Full-Time)
                  </label>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs text-slate-500">Academic Year</label>
                      <select
                        value={academicYearId}
                        onChange={(e) => setAcademicYearId(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                      >
                        <option value="">— Select year —</option>
                        {academicYears.map((year) => (
                          <option key={year.id} value={year.id}>
                            {year.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-slate-500">Semester</label>
                      <select
                        value={semesterId}
                        onChange={(e) => setSemesterId(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                      >
                        <option value="">— Select semester —</option>
                        {semesters?.map((sem) => (
                          <option key={sem.id} value={sem.id}>
                            {sem.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Exam Event or Date */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-black tracking-widest text-slate-400 uppercase">
                    {isFullTime ? 'Exam Event (optional)' : 'Exam Event'}
                  </label>
                  <select
                    value={eventId}
                    onChange={(e) => {
                      setEventId(e.target.value)
                      if (e.target.value) setExamDate('')
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                  >
                    <option value="">— Select event —</option>
                    {upcomingEvents.map((ev) => (
                      <option key={ev.id} value={ev.id}>
                        {ev.name} (
                        {new Date(ev.startDate).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                        )
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-xs font-black tracking-widest text-slate-400 uppercase">
                    {isFullTime ? 'Or Enter Date' : 'Or Enter Date'}
                  </label>
                  <input
                    type="date"
                    value={examDate}
                    onChange={(e) => {
                      setExamDate(e.target.value)
                      if (e.target.value) setEventId('')
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
              </div>

              {/* Attempt Type (for resit) */}
              {bookingType === 'RESIT' && (
                <div>
                  <label className="mb-2 block text-xs font-black tracking-widest text-slate-400 uppercase">
                    Attempt Type
                  </label>
                  <select
                    value={attemptType}
                    onChange={(e) => setAttemptType(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                  >
                    {ATTEMPT_TYPES.map((at) => (
                      <option key={at.value} value={at.value}>
                        {at.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Step 4: Payment Method */}
              <div>
                <label className="mb-2 block text-xs font-black tracking-widest text-slate-400 uppercase">
                  Payment Method
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setPaymentMethod('AUTO_DEBIT')}
                    className={`rounded-xl border p-3 text-left transition-all ${
                      paymentMethod === 'AUTO_DEBIT'
                        ? 'border-aerojet-blue bg-aerojet-blue/5 ring-1 ring-aerojet-blue'
                        : 'border-slate-200 hover:border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Wallet className="h-4 w-4 text-aerojet-blue" />
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        Auto-Debit Wallet
                      </span>
                    </div>
                    <p className="mt-1 text-[10px] text-slate-400">
                      Debit €{price} from student wallet immediately
                    </p>
                    {!canAfford && (
                      <p className="mt-1 flex items-center gap-1 text-[10px] font-bold text-red-500">
                        <AlertCircle className="h-3 w-3" />
                        Insufficient balance
                      </p>
                    )}
                  </button>
                  <button
                    onClick={() => setPaymentMethod('MANUAL_LATER')}
                    className={`rounded-xl border p-3 text-left transition-all ${
                      paymentMethod === 'MANUAL_LATER'
                        ? 'border-aerojet-blue bg-aerojet-blue/5 ring-1 ring-aerojet-blue'
                        : 'border-slate-200 hover:border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      Manual / Later
                    </div>
                    <p className="mt-1 text-[10px] text-slate-400">
                      Create booking as pending. Debit wallet manually later.
                    </p>
                  </button>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="mb-2 block text-xs font-black tracking-widest text-slate-400 uppercase">
                  Notes (optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any notes about this booking..."
                  rows={2}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                />
              </div>

              {/* Summary */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
                <h4 className="mb-2 text-xs font-black tracking-widest text-slate-400 uppercase">
                  Booking Summary
                </h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Type</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {selectedType.label}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Modules</span>
                    <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                      {selectedModules.length > 0
                        ? examComponents
                            .filter((c) => selectedModules.includes(c.id))
                            .map((c) => c.course?.code || c.code)
                            .join(', ')
                        : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Price</span>
                    <span className="text-lg font-black text-aerojet-blue">€{price}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Payment</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {paymentMethod === 'AUTO_DEBIT' ? 'Auto-debit wallet' : 'Manual / Later'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 flex items-center justify-end gap-3 border-t border-slate-100 bg-white px-6 py-4 dark:border-slate-800 dark:bg-slate-900">
              <button
                onClick={() => {
                  setOpen(false)
                  resetForm()
                }}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 transition-all duration-150 ease-out hover:border-slate-300 hover:bg-white hover:shadow-sm dark:border-slate-700 dark:hover:border-slate-600"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={
                  loading ||
                  selectedModules.length !== selectedType.modules ||
                  (!eventId && !examDate) ||
                  (paymentMethod === 'AUTO_DEBIT' && !canAfford)
                }
                className="flex items-center gap-2 rounded-xl bg-aerojet-blue px-6 py-2 text-sm font-bold text-white transition-all hover:bg-[#001f45] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {paymentMethod === 'AUTO_DEBIT'
                  ? `Book & Debit €${price}`
                  : 'Book (Pending Payment)'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
