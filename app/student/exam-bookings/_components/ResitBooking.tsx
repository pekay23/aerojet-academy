'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Loader2, RefreshCcw, BookOpen, Calendar, AlertTriangle, Wallet, CheckCircle2, X } from 'lucide-react'
import { getCurrencySymbol } from '@/lib/currency'
import { bookResitExamAction } from '@/app/student/actions'

interface FailedExam {
  examId: string
  examName: string
  moduleCode: string
  moduleName: string
  score: number
  passingScore: number
  examDate: string
  eventName: string | null
}

interface FreeResit {
  bookingGroupRef: string
  bookingType: string
  remaining: number
  notes: string | null
}

interface ResitBookingProps {
  failedExams: FailedExam[]
  freeResits: FreeResit[]
  resitPrice: number
  currency: string
  availableBalance: number
  trigger?: React.ReactNode
}

export default function ResitBooking({
  failedExams,
  freeResits,
  resitPrice,
  currency,
  availableBalance,
  trigger,
}: ResitBookingProps) {
  const [open, setOpen] = useState(false)
  const [selectedExam, setSelectedExam] = useState<FailedExam | null>(null)
  const [isPending, startTransition] = useTransition()

  const currencySymbol = getCurrencySymbol(currency)
  const totalFreeResits = freeResits.reduce((sum, r) => sum + r.remaining, 0)
  const canAfford = availableBalance >= resitPrice || totalFreeResits > 0

  const handleConfirm = () => {
    if (!selectedExam) return
    startTransition(async () => {
      try {
        const res = await bookResitExamAction(selectedExam.examId)
        if (res.error) {
          toast.error(res.error)
        } else {
          toast.success(`Resit for ${selectedExam.moduleCode} booked successfully!`)
          setSelectedExam(null)
          setOpen(false)
        }
      } catch {
        toast.error('Something went wrong. Please try again.')
      }
    })
  }

  if (trigger) {
    return (
      <>
        <div onClick={() => setOpen(true)}>{trigger}</div>
        {open && (
          <ResitModal
            failedExams={failedExams}
            freeResits={freeResits}
            resitPrice={resitPrice}
            currencySymbol={currencySymbol}
            availableBalance={availableBalance}
            totalFreeResits={totalFreeResits}
            canAfford={canAfford}
            selectedExam={selectedExam}
            setSelectedExam={setSelectedExam}
            onConfirm={handleConfirm}
            onClose={() => { setOpen(false); setSelectedExam(null) }}
            isPending={isPending}
          />
        )}
      </>
    )
  }

  // Inline mode (rendered within a tab)
  return (
    <ResitContent
      failedExams={failedExams}
      freeResits={freeResits}
      resitPrice={resitPrice}
      currencySymbol={currencySymbol}
      availableBalance={availableBalance}
      totalFreeResits={totalFreeResits}
      canAfford={canAfford}
      selectedExam={selectedExam}
      setSelectedExam={setSelectedExam}
      onConfirm={handleConfirm}
      isPending={isPending}
    />
  )
}

/* ── Inline Content (for tab view) ── */
function ResitContent({
  failedExams,
  freeResits,
  resitPrice,
  currencySymbol,
  availableBalance,
  totalFreeResits,
  canAfford,
  selectedExam,
  setSelectedExam,
  onConfirm,
  isPending,
}: {
  failedExams: FailedExam[]
  freeResits: FreeResit[]
  resitPrice: number
  currencySymbol: string
  availableBalance: number
  totalFreeResits: number
  canAfford: boolean
  selectedExam: FailedExam | null
  setSelectedExam: (e: FailedExam | null) => void
  onConfirm: () => void
  isPending: boolean
}) {
  if (failedExams.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-12 text-center dark:border-slate-700 dark:bg-slate-800/50">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-500 shadow-sm dark:bg-emerald-900/20">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">No failed exams</h3>
        <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
          Great news! You don&apos;t have any failed exams that require a resit. Keep up the good work!
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Free Resit Credit Banner */}
      {totalFreeResits > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50/50 px-5 py-4 dark:border-emerald-900/50 dark:bg-emerald-900/10">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <div>
            <p className="text-sm font-bold text-emerald-800 dark:text-emerald-200">
              You have {totalFreeResits} free resit{totalFreeResits > 1 ? 's' : ''} available
            </p>
            <p className="mt-0.5 text-xs text-emerald-600 dark:text-emerald-400">
              Included with your bundle booking{freeResits.length > 1 ? 's' : ''}. Free resits will be applied automatically.
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {freeResits.map((r) => (
                <span
                  key={r.bookingGroupRef}
                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                >
                  {r.bookingType} — {r.remaining} free
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Pricing Info */}
      <div className="flex items-start gap-3 rounded-xl border border-amber-100 bg-amber-50/40 px-5 py-4 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-900/10 dark:text-amber-300">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
        <div>
          <p className="font-bold">Resit Fee: {currencySymbol}{resitPrice.toFixed(2)} per exam</p>
          <p className="mt-0.5 text-xs text-amber-600 dark:text-amber-400">
            Resit fees are charged outside of bundles and subject to seat availability.
            {totalFreeResits > 0 && ' Free resit credits from bundles will be used first.'}
          </p>
        </div>
      </div>

      {/* Failed Exams Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {failedExams.map((exam) => {
          const isSelected = selectedExam?.examId === exam.examId
          return (
            <button
              key={exam.examId}
              onClick={() => setSelectedExam(isSelected ? null : exam)}
              className={`group relative flex flex-col rounded-2xl border p-5 text-left transition-all ${
                isSelected
                  ? 'border-red-300 bg-red-50 shadow-md ring-2 ring-red-500/20 dark:border-red-800 dark:bg-red-900/20'
                  : 'border-slate-100 bg-white hover:border-red-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900'
              }`}
            >
              {/* Module Badge */}
              <div className="mb-3 flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-2.5 py-1 text-xs font-bold text-red-600 dark:bg-red-900/30 dark:text-red-400">
                  <BookOpen className="h-3.5 w-3.5" />
                  {exam.moduleCode}
                </span>
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-600 uppercase dark:bg-red-900/30 dark:text-red-400">
                  Failed
                </span>
              </div>

              {/* Module Name */}
              <h4 className="mb-2 text-sm font-bold text-slate-900 dark:text-slate-100">
                {exam.moduleName}
              </h4>

              {/* Score */}
              <div className="mb-3 flex items-baseline gap-2">
                <span className="text-2xl font-black text-red-600 dark:text-red-400">
                  {exam.score}%
                </span>
                <span className="text-xs text-slate-400">
                  / {exam.passingScore}% required
                </span>
              </div>

              {/* Exam Details */}
              <div className="mt-auto space-y-1.5 border-t border-slate-50 pt-3 dark:border-slate-800">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <Calendar className="h-3 w-3" />
                  <span>{new Date(exam.examDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
                {exam.eventName && (
                  <p className="text-[10px] text-slate-400">{exam.eventName}</p>
                )}
              </div>

              {/* Selection indicator */}
              {isSelected && (
                <div className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-white shadow-sm">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Action Bar */}
      {selectedExam && (
        <div className="sticky bottom-4 rounded-2xl border border-slate-100 bg-white/90 p-5 shadow-xl backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/90">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Resit: {selectedExam.moduleCode} — {selectedExam.moduleName}
              </p>
              <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Wallet className="h-3.5 w-3.5" />
                  {totalFreeResits > 0 ? (
                    <span className="font-bold text-emerald-600">Free resit credit</span>
                  ) : (
                    <span>
                      Cost: <span className="font-bold text-slate-900 dark:text-slate-100">{currencySymbol}{resitPrice.toFixed(2)}</span>
                    </span>
                  )}
                </span>
                <span>
                  Balance: {currencySymbol}{availableBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setSelectedExam(null)}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                disabled={isPending || (!canAfford && totalFreeResits === 0)}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-xs font-bold text-white transition-all hover:bg-red-700 disabled:opacity-50 active:scale-[0.98]"
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCcw className="h-4 w-4" />
                )}
                Book Resit
              </button>
            </div>
          </div>
          {!canAfford && totalFreeResits === 0 && (
            <p className="mt-2 text-xs text-red-600 dark:text-red-400">
              Insufficient funds. Please top up your wallet before booking a resit.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

/* ── Modal version (for trigger-based usage) ── */
function ResitModal(props: {
  failedExams: FailedExam[]
  freeResits: FreeResit[]
  resitPrice: number
  currencySymbol: string
  availableBalance: number
  totalFreeResits: number
  canAfford: boolean
  selectedExam: FailedExam | null
  setSelectedExam: (e: FailedExam | null) => void
  onConfirm: () => void
  onClose: () => void
  isPending: boolean
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 pt-20">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={props.onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="resit-modal-title"
        onKeyDown={(e) => { if (e.key === 'Escape') props.onClose() }}
        className="relative z-10 w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-slate-900"
      >
        <div className="flex items-center justify-between border-b border-slate-100 p-6 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
              <RefreshCcw className="h-5 w-5" />
            </div>
            <div>
              <h3 id="resit-modal-title" className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Book a Resit</h3>
              <p className="text-sm text-slate-500">Select a failed exam to rebook</p>
            </div>
          </div>
          <button onClick={props.onClose} aria-label="Close" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-[65vh] overflow-y-auto p-6">
          <ResitContent
            failedExams={props.failedExams}
            freeResits={props.freeResits}
            resitPrice={props.resitPrice}
            currencySymbol={props.currencySymbol}
            availableBalance={props.availableBalance}
            totalFreeResits={props.totalFreeResits}
            canAfford={props.canAfford}
            selectedExam={props.selectedExam}
            setSelectedExam={props.setSelectedExam}
            onConfirm={props.onConfirm}
            isPending={props.isPending}
          />
        </div>
      </div>
    </div>
  )
}
