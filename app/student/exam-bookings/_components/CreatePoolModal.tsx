'use client'

import { useState, useTransition } from 'react'
import { createStudentPoolAction } from '@/app/student/actions'
import { toast } from 'sonner'
import { Loader2, Plus, ArrowRight, Wallet, Calendar, X, Info } from 'lucide-react'
import { getCurrencySymbol } from '@/lib/currency'
import { EASA_MODULES } from '@/lib/constants/easa-modules'

interface CreatePoolModalProps {
  events: { id: string; name: string; startDate: Date; endDate: Date }[]
  poolFee: number
  currency: string
  availableBalance: number
}

export default function CreatePoolModal({
  events,
  poolFee,
  currency,
  availableBalance,
}: CreatePoolModalProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const [eventId, setEventId] = useState('')
  const [moduleCode, setModuleCode] = useState('')
  const [examDate, setExamDate] = useState('')
  const [examTimeSlot, setExamTimeSlot] = useState<'MORNING' | 'AFTERNOON'>('MORNING')

  const currencySymbol = getCurrencySymbol(currency)
  const canAfford = availableBalance >= poolFee

  const selectedEvent = events.find((e) => e.id === eventId)

  const handleSubmit = () => {
    if (!eventId || !moduleCode || !examDate) {
      toast.error('Please fill in all required fields.')
      return
    }

    startTransition(async () => {
      try {
        const res = await createStudentPoolAction({
          eventId,
          moduleCode,
          examDate,
          examTimeSlot,
        })

        if (res.error) {
          toast.error(res.error)
        } else {
          toast.success(`Booking created successfully! Seat reserved for Module ${moduleCode}.`)
          setOpen(false)
          // Reset form
          setEventId('')
          setModuleCode('')
          setExamDate('')
        }
      } catch (_err) {
        toast.error('Something went wrong. Please try again.')
      }
    })
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-xl bg-blue-800 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition-all hover:bg-[#003a7c] active:scale-95"
      >
        <Plus className="h-4 w-4" />
        Start New Booking
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => !isPending && setOpen(false)}
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-pool-title"
            onKeyDown={(e) => { if (e.key === 'Escape' && !isPending) setOpen(false) }}
            className="relative z-10 w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-8 py-6 dark:border-slate-800">
              <div>
                <h2 id="create-pool-title" className="text-xl font-black tracking-tight text-slate-900 dark:text-slate-100">
                  Start New Exam Booking
                </h2>
                <p className="mt-1 text-xs text-pretty text-slate-500 dark:text-slate-400">
                  Initiate a booking for a module not currently listed. Minimum 25 candidates required
                  for confirmation.
                </p>
              </div>
              <button
                onClick={() => !isPending && setOpen(false)}
                aria-label="Close"
                className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[70vh] space-y-6 overflow-y-auto p-8">
              {/* Wallet reservation warning */}
              <div className="flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-5 dark:border-blue-800 dark:bg-blue-900/20">
                <Wallet className="h-6 w-6 text-blue-600" />
                <div className="flex-1">
                  <p className="text-xs font-bold tracking-widest text-slate-500 uppercase">
                    Seat Reservation
                  </p>
                  <p className="mt-1 text-lg leading-none font-black text-slate-900 dark:text-slate-100">
                    {currencySymbol}
                    {poolFee.toFixed(2)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="mb-1 inline-block rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-600 dark:bg-blue-900/40 dark:text-blue-400">
                    On Hold
                  </p>
                  <p className="text-xs text-slate-500">Refundable if failed</p>
                </div>
              </div>

              {/* Form Grid */}
              <div className="grid gap-6 sm:grid-cols-2">
                {/* Exam Event */}
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">
                    Target Exam Event
                  </label>
                  <select
                    value={eventId}
                    onChange={(e) => setEventId(e.target.value)}
                    disabled={isPending}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-medium transition-all outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    <option value="">— Select an upcoming event —</option>
                    {events.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.name} ({new Date(e.startDate).toLocaleDateString()} -{' '}
                        {new Date(e.endDate).toLocaleDateString()})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Module */}
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">
                    EASA Module Course
                  </label>
                  <select
                    value={moduleCode}
                    onChange={(e) => setModuleCode(e.target.value)}
                    disabled={isPending}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-medium transition-all outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    <option value="">— Choose module —</option>
                    {EASA_MODULES.map((m) => (
                      <option key={m.code} value={m.code}>
                        {m.code} — {m.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Preferred Date */}
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">
                    Preferred Date
                  </label>
                  <div className="relative">
                    <Calendar className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="date"
                      value={examDate}
                      onChange={(e) => setExamDate(e.target.value)}
                      disabled={isPending || !eventId}
                      min={
                        selectedEvent
                          ? new Date(selectedEvent.startDate).toISOString().split('T')[0]
                          : undefined
                      }
                      max={
                        selectedEvent
                          ? new Date(selectedEvent.endDate).toISOString().split('T')[0]
                          : undefined
                      }
                      className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pr-4 pl-11 text-sm font-medium transition-all outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    />
                  </div>
                </div>

                {/* Time Slot */}
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">
                    Preferred Slot
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setExamTimeSlot('MORNING')}
                      className={`flex flex-col items-center justify-center gap-1 rounded-2xl border px-3 py-2.5 transition-all ${
                        examTimeSlot === 'MORNING'
                          ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                          : 'border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className="text-xs font-black uppercase">Morning</span>
                      <span className="text-xs opacity-70">09:00 - 12:00</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setExamTimeSlot('AFTERNOON')}
                      className={`flex flex-col items-center justify-center gap-1 rounded-2xl border px-3 py-2.5 transition-all ${
                        examTimeSlot === 'AFTERNOON'
                          ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                          : 'border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className="text-xs font-black uppercase">Afternoon</span>
                      <span className="text-xs opacity-70">13:00 - 16:00</span>
                    </button>
                  </div>
                </div>
              </div>

              {!canAfford && (
                <div className="flex gap-3 rounded-2xl border border-amber-100 bg-amber-50 p-4 dark:border-amber-900/30 dark:bg-amber-900/20">
                  <Info className="h-5 w-5 shrink-0 text-amber-600" />
                  <div className="text-xs leading-relaxed text-amber-800 dark:text-amber-400">
                    <p className="mb-1 font-bold">Insufficient Wallet Balance</p>
                    You need at least {currencySymbol}
                    {poolFee.toFixed(2)} to start a booking and reserve your seat.
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-slate-100 bg-slate-50 p-8 dark:border-slate-800 dark:bg-slate-900/50">
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={isPending}
                  className="flex-1 rounded-2xl border border-slate-200 bg-white py-4 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isPending || !canAfford || !eventId || !moduleCode || !examDate}
                  className="flex flex-[1.5] items-center justify-center gap-2 rounded-2xl bg-blue-800 py-4 text-sm font-bold text-white shadow-lg shadow-blue-900/20 transition-all hover:bg-[#003a7c] active:scale-95 disabled:opacity-50"
                >
                  {isPending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      Create Booking & Join
                      <ArrowRight className="h-5 w-5" />
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
