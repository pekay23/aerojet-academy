'use client'

import { useState, useTransition } from 'react'
import { createStudentPoolAction } from '@/app/student/actions'
import { toast } from 'sonner'
import { Loader2, ArrowRight, Users, Wallet, Calendar, Clock, X, Info, BookOpen } from 'lucide-react'
import { getCurrencySymbol } from '@/lib/currency'

const MAX_MODULES = 4
const MAX_SEATS = 28

interface ExamComponent {
  id: string
  code: string
  name: string
}

interface GroupBookingModalProps {
  events: { id: string; name: string; startDate: Date; endDate: Date }[]
  examComponents: ExamComponent[]
  groupCharterFee: number
  currency: string
  availableBalance: number
  trigger?: React.ReactNode
}

export default function GroupBookingModal({
  events,
  examComponents,
  groupCharterFee = 7500,
  currency,
  availableBalance,
  trigger,
}: GroupBookingModalProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const [eventId, setEventId] = useState('')
  const [selectedModules, setSelectedModules] = useState<string[]>([])
  const [examDate, setExamDate] = useState('')
  const [examTimeSlot, setExamTimeSlot] = useState<'MORNING' | 'AFTERNOON'>('MORNING')
  const [seats, setSeats] = useState(1)
  const [organizationName, setOrganizationName] = useState('')

  const currencySymbol = getCurrencySymbol(currency)
  const canAfford = availableBalance >= groupCharterFee
  const selectedEvent = events.find((e) => e.id === eventId)

  const toggleModule = (code: string) => {
    setSelectedModules((prev) => {
      if (prev.includes(code)) return prev.filter((c) => c !== code)
      if (prev.length >= MAX_MODULES) {
        toast.error(`You can select up to ${MAX_MODULES} modules per group booking.`)
        return prev
      }
      return [...prev, code]
    })
  }

  const resetForm = () => {
    setEventId('')
    setSelectedModules([])
    setExamDate('')
    setExamTimeSlot('MORNING')
    setSeats(1)
    setOrganizationName('')
  }

  const handleSubmit = () => {
    if (!eventId) {
      toast.error('Please select a target exam event.')
      return
    }
    if (selectedModules.length === 0) {
      toast.error('Please select at least one EASA module.')
      return
    }
    if (!examDate) {
      toast.error('Please select a preferred exam date.')
      return
    }
    if (!organizationName.trim()) {
      toast.error('Please enter your organization or group name.')
      return
    }
    if (seats < 1 || seats > MAX_SEATS) {
      toast.error(`Number of seats must be between 1 and ${MAX_SEATS}.`)
      return
    }

    startTransition(async () => {
      try {
        const res = await createStudentPoolAction({
          eventId,
          moduleCode: selectedModules.join(','),
          examDate,
          examTimeSlot,
          bookingType: 'GROUP_CHARTER',
          seats,
          organizationName: organizationName.trim(),
        })

        if (res.error) {
          toast.error(res.error)
        } else {
          toast.success(
            `Group charter requested successfully! ${currencySymbol}${groupCharterFee.toFixed(2)} reserved from your wallet.`
          )
          setOpen(false)
          resetForm()
        }
      } catch (err) {
        toast.error('Something went wrong. Please try again.')
      }
    })
  }

  const isFormValid =
    eventId &&
    selectedModules.length > 0 &&
    examDate &&
    organizationName.trim() &&
    seats >= 1 &&
    seats <= MAX_SEATS

  return (
    <>
      {trigger ? (
        <div onClick={() => setOpen(true)} className="cursor-pointer">
          {trigger}
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-blue-800 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition-all hover:bg-[#003a7c] active:scale-95"
        >
          <Users className="h-4 w-4" />
          Start New Group Booking
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => !isPending && setOpen(false)}
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="group-booking-title"
            onKeyDown={(e) => { if (e.key === 'Escape' && !isPending) setOpen(false) }}
            className="relative z-10 w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-8 py-6 dark:border-slate-800">
              <div>
                <h2 id="group-booking-title" className="text-xl font-black tracking-tight text-blue-800 dark:text-white">
                  Group Charter Booking
                </h2>
                <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                  Reserve an exam session for your organization or group.
                </p>
              </div>
              <button
                onClick={() => !isPending && setOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-700 dark:hover:bg-slate-800 transition-colors"
                disabled={isPending}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[70vh] space-y-6 overflow-y-auto p-8">
              {/* Cost & Balance */}
              <div className="flex items-center gap-4 rounded-2xl border border-blue-100 bg-blue-50/50 p-5 dark:border-blue-800 dark:bg-blue-900/20">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400">
                  <Wallet className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                    Your Balance
                  </p>
                  <p className="mt-1 text-xl font-black text-slate-900 dark:text-white">
                    {currencySymbol}{availableBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                    Total Cost
                  </p>
                  <p className="mt-1 text-xl font-black text-blue-800 dark:text-blue-300">
                    {currencySymbol}{groupCharterFee.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Info note */}
              <div className="flex gap-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/30">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                <p className="text-[10px] font-medium leading-relaxed text-slate-500 dark:text-slate-400">
                  Group Charter covers up to 28 seats for your organization. All seats share the same exam date and time slot.
                </p>
              </div>

              {/* Form */}
              <div className="grid gap-6 sm:grid-cols-2">
                {/* Organization Name */}
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-tight">
                    Organization / Group Name
                  </label>
                  <input
                    type="text"
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    disabled={isPending}
                    placeholder="e.g. Aerojet Academy Cohort 12"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-bold text-slate-900 transition-all outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                {/* Target Exam Event */}
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-tight">
                    Target Exam Event
                  </label>
                  <select
                    value={eventId}
                    onChange={(e) => {
                      setEventId(e.target.value)
                      setExamDate('')
                    }}
                    disabled={isPending}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-bold text-slate-900 transition-all outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="">-- Select an upcoming event --</option>
                    {events.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* EASA Modules (checkboxes) */}
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-tight">
                    EASA Modules Exam{' '}
                    <span className="text-xs font-medium text-slate-400 normal-case">
                      ({selectedModules.length}/{MAX_MODULES} selected)
                    </span>
                  </label>
                  <div className="max-h-48 overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
                    {examComponents.map((ec) => {
                      const isChecked = selectedModules.includes(ec.code)
                      const isDisabled =
                        isPending || (!isChecked && selectedModules.length >= MAX_MODULES)
                      return (
                        <label
                          key={ec.id}
                          className={`flex cursor-pointer items-center gap-3 border-b border-slate-100 px-4 py-3 transition-colors last:border-b-0 dark:border-slate-700 ${
                            isDisabled && !isChecked
                              ? 'cursor-not-allowed opacity-40'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
                          } ${isChecked ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleModule(ec.code)}
                            disabled={isDisabled}
                            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <div className="flex-1">
                            <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">
                              {ec.code}
                            </p>
                            <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                              {ec.name}
                            </p>
                          </div>
                        </label>
                      )
                    })}
                  </div>
                </div>

                {/* Preferred Date */}
                <div className="space-y-2">
                  <label className="block text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-tight">
                    Preferred Exam Date
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
                      className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pr-4 pl-11 text-sm font-bold text-slate-900 transition-all outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                {/* Time Slot */}
                <div className="space-y-2">
                  <label className="block text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-tight">
                    Preferred Slot
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setExamTimeSlot('MORNING')}
                      className={`flex flex-col items-center justify-center gap-1 rounded-2xl border px-3 py-2.5 transition-all ${
                        examTimeSlot === 'MORNING'
                          ? 'border-blue-800 bg-blue-50/50 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
                          : 'border-slate-100 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <span className="text-xs font-black uppercase">Morning</span>
                      <span className="text-[10px] font-medium opacity-70">09:00 - 12:00</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setExamTimeSlot('AFTERNOON')}
                      className={`flex flex-col items-center justify-center gap-1 rounded-2xl border px-3 py-2.5 transition-all ${
                        examTimeSlot === 'AFTERNOON'
                          ? 'border-blue-800 bg-blue-50/50 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
                          : 'border-slate-100 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <span className="text-xs font-black uppercase">Afternoon</span>
                      <span className="text-[10px] font-medium opacity-70">13:00 - 16:00</span>
                    </button>
                  </div>
                </div>

                {/* Number of Seats */}
                <div className="sm:col-span-2 space-y-2">
                  <label className="block text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-tight">
                    Number of Seats{' '}
                    <span className="text-xs font-medium text-slate-400 normal-case">(max {MAX_SEATS})</span>
                  </label>
                  <input
                    type="number"
                    value={seats}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10)
                      if (!isNaN(val)) setSeats(Math.min(Math.max(val, 1), MAX_SEATS))
                    }}
                    disabled={isPending}
                    min={1}
                    max={MAX_SEATS}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-bold text-slate-900 transition-all outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              {!canAfford && (
                <div className="flex items-start gap-4 rounded-2xl border border-amber-100 bg-amber-50/50 p-5 dark:border-amber-900/30 dark:bg-amber-900/20">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400">
                    <Wallet className="h-5 w-5" />
                  </div>
                  <div className="text-xs font-medium leading-relaxed text-amber-800 dark:text-amber-300">
                    <p className="mb-1 font-black uppercase tracking-tight">Insufficient Wallet Balance</p>
                    You need at least <strong>{currencySymbol}{groupCharterFee.toFixed(2)}</strong> to request a group charter.
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
                  className="flex-1 rounded-2xl border border-slate-200 bg-white py-4 text-sm font-black text-slate-700 transition-all hover:bg-slate-50 hover:border-slate-300 active:scale-95 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isPending || !canAfford || !isFormValid}
                  className="flex flex-[1.5] items-center justify-center gap-2 rounded-2xl bg-blue-800 py-4 text-sm font-black text-white shadow-lg shadow-blue-800/20 transition-all hover:bg-[#003a7c] hover:shadow-xl active:scale-95 disabled:opacity-50"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Request Group Charter
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
