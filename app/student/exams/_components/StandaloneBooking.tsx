'use client'

import { useState, useTransition } from 'react'
import { bookStandaloneExamAction } from '@/app/student/actions'
import { toast } from 'sonner'
import {
  Loader2,
  ArrowRight,
  BookOpen,
  Wallet,
  Calendar,
  X,
  AlertCircle,
  ChevronDown,
} from 'lucide-react'
import { getCurrencySymbol } from '@/lib/currency'

interface ExamWithCourse {
  id: string
  name: string
  examDate: Date
  examComponent: {
    course: { code: string; name: string }
  }
}

interface ExamComponent {
  id: string
  code: string
  name: string
  type?: 'MCQ' | 'ESSAY'
  categoryCode?: string | null
  questionCount?: number | null
  courseCode?: string
  courseName?: string
}

interface ExamEvent {
  id: string
  name: string
  startDate: Date
  endDate: Date
}

interface StandaloneBookingProps {
  pricing: { individualExamFee: number; lateBookingDays: number; lateBookingSurcharge: number }
  currency: string
  availableBalance: number
  upcomingExams: ExamWithCourse[]
  examComponents: ExamComponent[]
  events: ExamEvent[]
  trigger?: React.ReactNode
  /**
   * If provided, the modal operates in "use existing bundle" mode:
   * seats are consumed from this bundle instead of charging the wallet.
   */
  existingBundle?: {
    id: string
    bundleType: 'TWO_SEAT' | 'FOUR_SEAT'
    totalSeats: number
    usedSeats: number
  } | null
}

export default function StandaloneBooking({
  pricing,
  currency,
  availableBalance,
  upcomingExams,
  examComponents,
  events,
  trigger,
  existingBundle,
}: StandaloneBookingProps) {
  const [open, setOpen] = useState(false)
  const [selectedExamId, setSelectedExamId] = useState('')
  const [selectedModuleCode, setSelectedModuleCode] = useState('')
  const [selectedEventId, setSelectedEventId] = useState(events[0]?.id || '')
  const [isPending, startTransition] = useTransition()

  const currencySymbol = getCurrencySymbol(currency)
  const isExistingBundle = !!existingBundle
  const remainingSeats = existingBundle ? existingBundle.totalSeats - existingBundle.usedSeats : 0
  const bundleLabel = isExistingBundle
    ? existingBundle!.bundleType === 'TWO_SEAT'
      ? 'Use My Twin Pack'
      : 'Use My 4-Pack'
    : 'Book Individual Seat'
  const shortLabel = isExistingBundle
    ? existingBundle!.bundleType === 'TWO_SEAT'
      ? 'Twin'
      : '4-Pk'
    : 'Single'

  // Calculate dynamic surcharge based on selection
  let surcharge = 0
  let targetDate: Date | null = null

  if (selectedExamId) {
    const exam = upcomingExams.find((e) => e.id === selectedExamId)
    if (exam) targetDate = new Date(exam.examDate)
  } else if (selectedModuleCode && selectedEventId) {
    const event = events.find((e) => e.id === selectedEventId)
    if (event) targetDate = new Date(event.startDate)
  }

  if (targetDate) {
    // eslint-disable-next-line react-hooks/purity
    const daysUntilExam = Math.ceil((targetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    if (daysUntilExam <= pricing.lateBookingDays && daysUntilExam > 0) {
      surcharge = pricing.lateBookingSurcharge
    }
  }

  const finalPrice = pricing.individualExamFee + surcharge
  const canAfford = availableBalance >= finalPrice

  /** Group exam components by course code, then by type + category. */
  interface ModuleGroup {
    courseCode: string
    courseName: string
    groups: {
      label: string
      items: ExamComponent[]
    }[]
  }
  const groupedModules = (() => {
    const byCourse = new Map<string, ModuleGroup>()
    for (const ec of examComponents) {
      const cc = ec.courseCode || 'Other'
      if (!byCourse.has(cc)) {
        byCourse.set(cc, {
          courseCode: cc,
          courseName: ec.courseName || cc,
          groups: [],
        })
      }
      const g = byCourse.get(cc)!
      const typeLabel = ec.type === 'ESSAY' ? 'Essay' : 'MCQ'
      const catLabel = ec.categoryCode ? `Cat ${ec.categoryCode}` : ''
      const subKey = [typeLabel, catLabel].filter(Boolean).join(' · ')
      let sub = g.groups.find((s) => s.label === subKey)
      if (!sub) {
        sub = { label: subKey, items: [] }
        g.groups.push(sub)
      }
      sub.items.push(ec)
    }
    for (const g of byCourse.values()) {
      g.groups.sort((a, b) => a.label.localeCompare(b.label))
    }
    return [...byCourse.values()].sort((a, b) => {
      const na = parseInt(a.courseCode.match(/\d+/)?.[0] || '0', 10)
      const nb = parseInt(b.courseCode.match(/\d+/)?.[0] || '0', 10)
      if (na !== nb) return na - nb
      return a.courseCode.localeCompare(b.courseCode, undefined, {
        numeric: true,
        sensitivity: 'base',
      })
    })
  })()

  /** Track which course accordions are expanded. */
  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(() => {
    const s = new Set<string>()
    for (const g of groupedModules) s.add(g.courseCode)
    return s
  })

  const toggleCourse = (cc: string) => {
    setExpandedCourses((prev) => {
      const next = new Set(prev)
      if (next.has(cc)) next.delete(cc)
      else next.add(cc)
      return next
    })
  }

  const handleConfirm = () => {
    // Priority 1: Specific Scheduled Exam
    // Priority 2: Module + Event pairing
    if (!selectedExamId && !selectedModuleCode) {
      toast.error('Please select an exam or module before booking.')
      return
    }

    startTransition(async () => {
      try {
        const res = await bookStandaloneExamAction({
          examId: selectedExamId || undefined,
          moduleCode: selectedModuleCode || undefined,
          eventId: selectedEventId || undefined,
        })

        if (res.error) {
          toast.error(res.error)
        } else {
          if (res.usedBundle) {
            toast.success('Exam booked successfully!  seat deducted from your bundle.')
          } else {
            toast.success(
              `Exam booked successfully! ${currencySymbol}${finalPrice.toFixed(2)} charged from your wallet.`
            )
          }
          setOpen(false)
          setSelectedExamId('')
          setSelectedModuleCode('')
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Something went wrong. Please try again.'
        toast.error(message)
      }
    })
  }

  return (
    <>
      {trigger ? (
        <div onClick={() => setOpen(true)} className="cursor-pointer">
          {trigger}
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 transition-all hover:border-blue-300 hover:bg-blue-50/50 active:scale-95 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
        >
          {isExistingBundle ? shortLabel : 'Book Individual Seat...'}
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => !isPending && setOpen(false)}
          />

          <div className="relative z-10 w-full max-w-6xl overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5 dark:border-slate-800">
              <div>
                <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-slate-100">
                  {isExistingBundle ? bundleLabel : 'Individual Exam Booking'}
                </h2>
                <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                  {isExistingBundle
                    ? `Select a module to use from your remaining ${remainingSeats} seat${remainingSeats !== 1 ? 's' : ''} (no charge).`
                    : 'Select a module and event to book your individual seat.'}
                </p>
              </div>
              <button
                onClick={() => !isPending && setOpen(false)}
                aria-label="Close dialog"
                className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-700 dark:hover:bg-slate-800"
                disabled={isPending}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid max-h-[75vh] grid-cols-1 gap-6 overflow-y-auto p-8 lg:grid-cols-2">
              {/* Left column: Pricing + Event + Info */}
              <div className="space-y-6">
                <div className="flex items-center gap-4 rounded-2xl border border-blue-100 bg-blue-50/50 p-5 dark:border-blue-800 dark:bg-blue-900/20">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400">
                    <Wallet className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                      {isExistingBundle ? 'Cost' : 'Total Price'}
                    </p>
                    <p className="mt-1 text-xl font-black text-slate-900 dark:text-white">
                      {isExistingBundle
                        ? `${currencySymbol}0.00`
                        : `${currencySymbol}${finalPrice.toFixed(2)}`}
                    </p>
                  </div>
                  <div className="text-right">
                    {isExistingBundle ? (
                      <p className="mb-1 inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black tracking-tight text-emerald-800 uppercase dark:bg-emerald-900/40 dark:text-emerald-300">
                        Using Package
                      </p>
                    ) : (
                      <>
                        <p className="mb-1 inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black tracking-tight text-emerald-800 uppercase dark:bg-emerald-900/40 dark:text-emerald-300">
                          Balance
                        </p>
                        <p className="text-xs font-medium text-slate-500">
                          {currencySymbol}
                          {availableBalance.toFixed(2)}
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {surcharge > 0 && (
                  <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs font-bold tracking-wide text-red-700 uppercase dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                    <span>
                      A late booking surcharge of {currencySymbol}
                      {surcharge} has been applied because this exam is within{' '}
                      {pricing.lateBookingDays} days.
                    </span>
                  </div>
                )}

                {/* Scheduled Exams Dropdown (Primary) */}
                {upcomingExams.length > 0 && (
                  <div>
                    <label className="mb-2 flex items-center gap-1.5 text-sm font-bold text-slate-700 dark:text-slate-300">
                      <Calendar className="h-4 w-4" />
                      Scheduled Session (Optional)
                    </label>
                    <select
                      value={selectedExamId}
                      onChange={(e) => {
                        setSelectedExamId(e.target.value)
                        if (e.target.value) setSelectedModuleCode('')
                      }}
                      disabled={isPending}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    >
                      <option value="">— Choose a specific session —</option>
                      {upcomingExams.map((exam) => (
                        <option key={exam.id} value={exam.id}>
                          {exam.examComponent.course.code} | {exam.name} (
                          {new Date(exam.examDate).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                          })}
                          )
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Module Dropdown (Secondary/Fallback) */}
                {!selectedExamId && (
                  <div>
                    <label className="mb-2 flex items-center gap-1.5 text-sm font-bold text-slate-700 dark:text-slate-300">
                      <Calendar className="h-4 w-4" />
                      Target Exam Event
                    </label>
                    <select
                      value={selectedEventId}
                      onChange={(e) => setSelectedEventId(e.target.value)}
                      disabled={isPending}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    >
                      {events.map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {!canAfford && (
                  <div className="rounded-lg bg-amber-50 p-3 text-xs text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
                    Insufficient funds to book a standalone seat. Please top up your wallet.
                  </div>
                )}
              </div>

              {/* Right column: Module Selection */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-black tracking-tight text-slate-700 uppercase dark:text-slate-200">
                  <BookOpen className="h-4 w-4 text-blue-800" />
                  Select a Module
                </label>
                <div className="max-h-[60vh] space-y-2 overflow-y-auto pr-1">
                  {groupedModules.map((course) => {
                    const isExpanded = expandedCourses.has(course.courseCode)
                    const totalInCourse = course.groups.reduce((sum, g) => sum + g.items.length, 0)
                    return (
                      <div
                        key={course.courseCode}
                        className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800/40"
                      >
                        <button
                          type="button"
                          onClick={() => toggleCourse(course.courseCode)}
                          className="flex w-full items-center justify-between px-4 py-2.5 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/40"
                        >
                          <div className="flex items-center gap-2">
                            <ChevronDown
                              className={`h-4 w-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                            />
                            <span className="text-sm font-black tracking-tight text-slate-900 dark:text-slate-100">
                              {course.courseCode}
                            </span>
                            <span className="text-[10px] font-medium text-slate-400">
                              {course.courseName}
                            </span>
                          </div>
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500 dark:bg-slate-700 dark:text-slate-300">
                            {totalInCourse}
                          </span>
                        </button>
                        {isExpanded && (
                          <div className="space-y-2 border-t border-slate-100 p-3 dark:border-slate-700/60">
                            {course.groups.map((sub) => (
                              <div key={sub.label} className="space-y-1.5">
                                <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                                  {sub.label}
                                </p>
                                <div className="grid grid-cols-2 gap-1.5">
                                  {sub.items.map((ec) => {
                                    const isSelected = selectedModuleCode === ec.code
                                    return (
                                      <button
                                        key={ec.id}
                                        type="button"
                                        onClick={() => setSelectedModuleCode(ec.code)}
                                        disabled={isPending}
                                        className={`group relative rounded-lg border p-2 text-left transition-all ${
                                          isSelected
                                            ? 'border-blue-800 bg-blue-50/50 dark:border-blue-500 dark:bg-blue-900/20'
                                            : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:hover:border-slate-600 dark:hover:bg-slate-800/50'
                                        }`}
                                      >
                                        <p
                                          className={`text-[11px] font-black tracking-tight uppercase ${isSelected ? 'text-blue-800 dark:text-blue-300' : 'text-slate-900 dark:text-slate-100'}`}
                                        >
                                          {ec.code}
                                        </p>
                                        <p className="mt-0.5 line-clamp-1 text-[9px] font-medium text-slate-500 dark:text-slate-400">
                                          {ec.name}
                                          {ec.questionCount ? ` · ${ec.questionCount}q` : ''}
                                        </p>
                                      </button>
                                    )
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Bundle validity note */}
            <div className="flex items-center gap-3 rounded-xl border border-amber-100 bg-amber-50/50 px-5 py-3 text-xs text-amber-800 dark:border-amber-900/30 dark:bg-amber-900/20 dark:text-amber-300">
              <Calendar className="h-4 w-4 shrink-0 text-amber-600" />
              <span>
                <strong>Bundle validity:</strong> Exam bundles are valid for{' '}
                <strong>12 months</strong> from purchase. Seats are auto-assigned to pools by the
                enrollment deadline. Unused seats do not roll over.
              </span>
            </div>

            {/* Footer */}
            <div className="border-t border-slate-100 bg-slate-50 p-8 dark:border-slate-800 dark:bg-slate-900/50">
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={isPending}
                  className="flex-1 rounded-2xl border border-slate-200 bg-white py-4 text-sm font-black text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50 active:scale-95 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={
                    isPending ||
                    (!selectedExamId && !selectedModuleCode) ||
                    (!isExistingBundle && !canAfford)
                  }
                  className="flex flex-[1.5] items-center justify-center gap-2 rounded-2xl bg-blue-800 py-4 text-sm font-black text-white shadow-lg shadow-blue-800/20 transition-all hover:bg-[#003a7c] hover:shadow-xl active:scale-95 disabled:opacity-50"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      {isExistingBundle ? 'Confirm Seat' : 'Confirm Booking'}
                      {!isPending && <ArrowRight className="h-5 w-5" />}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
