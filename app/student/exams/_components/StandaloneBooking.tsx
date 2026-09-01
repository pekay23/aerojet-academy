'use client'

import { useState, useTransition } from 'react'
import { bookStandaloneExamAction } from '@/app/student/actions'
import { toast } from 'sonner'
import { Loader2, ArrowRight, BookOpen, Wallet, Calendar, X, AlertCircle } from 'lucide-react'
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
}

export default function StandaloneBooking({
  pricing,
  currency,
  availableBalance,
  upcomingExams,
  examComponents,
  events,
  trigger,
}: StandaloneBookingProps) {
  const [open, setOpen] = useState(false)
  const [selectedExamId, setSelectedExamId] = useState('')
  const [selectedModuleCode, setSelectedModuleCode] = useState('')
  const [selectedEventId, setSelectedEventId] = useState(events[0]?.id || '')
  const [isPending, startTransition] = useTransition()

  const currencySymbol = getCurrencySymbol(currency)

  // Calculate dynamic surcharge based on selection
  let surcharge = 0
  let targetDate: Date | null = null

  if (selectedExamId) {
    const exam = upcomingExams.find(e => e.id === selectedExamId)
    if (exam) targetDate = new Date(exam.examDate)
  } else if (selectedModuleCode && selectedEventId) {
    const event = events.find(e => e.id === selectedEventId)
    if (event) targetDate = new Date(event.startDate)
  }

  if (targetDate) {
    const daysUntilExam = Math.ceil((targetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    if (daysUntilExam <= pricing.lateBookingDays && daysUntilExam > 0) {
      surcharge = pricing.lateBookingSurcharge
    }
  }

  const finalPrice = pricing.individualExamFee + surcharge
  const canAfford = availableBalance >= finalPrice

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
      } catch (err: any) {
        toast.error(err.message || 'Something went wrong. Please try again.')
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
          Book Individual Seat...
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => !isPending && setOpen(false)}
          />

          <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5 dark:border-slate-800">
              <div>
                <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-slate-100">
                  Individual Exam Booking
                </h2>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  Select a module and event to book your individual seat.
                </p>
              </div>
              <button
                onClick={() => !isPending && setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-5 p-6">
              <div className="flex items-center gap-3 rounded-xl bg-blue-50 p-4 dark:bg-blue-900/20">
                <Wallet className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-xs font-bold tracking-widest text-slate-500 uppercase">
                    Balance
                  </p>
                  <p className="text-base font-black text-slate-900 dark:text-slate-100">
                    {currencySymbol}
                    {availableBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-xs font-bold tracking-widest text-slate-500 uppercase">Fee</p>
                  <p className="text-base font-black text-blue-700 dark:text-blue-400">
                    {currencySymbol}
                    {finalPrice.toFixed(2)}
                  </p>
                </div>
              </div>

              {surcharge > 0 && (
                <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400 font-bold uppercase tracking-wide">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                  <span>
                    A late booking surcharge of {currencySymbol}{surcharge} has been applied because this exam is within {pricing.lateBookingDays} days.
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
                <>
                  <div>
                    <label className="mb-2 flex items-center gap-1.5 text-sm font-bold text-slate-700 dark:text-slate-300">
                      <BookOpen className="h-4 w-4" />
                      Select Module Exam
                    </label>
                    <select
                      value={selectedModuleCode}
                      onChange={(e) => setSelectedModuleCode(e.target.value)}
                      disabled={isPending}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    >
                      <option value="">— Select a module —</option>
                      {examComponents.map((ec) => (
                        <option key={ec.id} value={ec.code}>
                          {ec.courseCode ? `${ec.courseCode} | ` : ''}{ec.code} | {ec.name}
                          {ec.categoryCode ? ` | Cat ${ec.categoryCode}` : ''}
                          {ec.questionCount ? ` | ${ec.questionCount} questions` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedModuleCode && events.length > 0 && (
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
                </>
              )}

              {!canAfford && (
                <div className="rounded-lg bg-amber-50 p-3 text-xs text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
                  Insufficient funds to book a standalone seat. Please top up your wallet.
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setOpen(false)}
                  className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-bold text-slate-700 dark:border-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={isPending || (!selectedExamId && !selectedModuleCode) || !canAfford}
                  className="flex flex-[1.5] items-center justify-center gap-2 rounded-xl bg-blue-800 py-3 text-sm font-bold text-white hover:bg-[#003a7c] active:scale-95 disabled:opacity-50"
                >
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm Booking'}
                  {!isPending && <ArrowRight className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
