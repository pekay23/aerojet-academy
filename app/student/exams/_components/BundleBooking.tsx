'use client'

import { useState, useTransition } from 'react'
import { bookBundleExamsAtomicAction } from '@/app/student/actions'
import { toast } from 'sonner'
import { Loader2, ArrowRight, BookOpen, Wallet, Calendar, X, Package, Info } from 'lucide-react'
import { getCurrencySymbol } from '@/lib/currency'

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

interface BundleBookingProps {
  bundleSize: 2 | 4
  bundlePrice: number
  individualPrice: number
  currency: string
  availableBalance: number
  events: ExamEvent[]
  examComponents: ExamComponent[]
  trigger?: React.ReactNode
}

export default function BundleBooking({
  bundleSize,
  bundlePrice,
  individualPrice,
  currency,
  availableBalance,
  events,
  examComponents,
  trigger,
}: BundleBookingProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [selectedModules, setSelectedModules] = useState<string[]>([])
  const [selectedEventId, setSelectedEventId] = useState(events[0]?.id || '')

  const currencySymbol = getCurrencySymbol(currency)
  const canAfford = availableBalance >= bundlePrice
  const savings = individualPrice * bundleSize - bundlePrice
  const label = bundleSize === 2 ? 'Book Twin Pack' : 'Book 4 Pack'
  const shortLabel = bundleSize === 2 ? 'Twin' : '4-Pk'

  const toggleModule = (code: string) => {
    setSelectedModules((prev) => {
      if (prev.includes(code)) return prev.filter((m) => m !== code)
      if (prev.length >= bundleSize) return prev
      return [...prev, code]
    })
  }

  const handleSubmit = () => {
    if (selectedModules.length !== bundleSize) {
      toast.error(`Please select exactly ${bundleSize} modules for your ${label}.`)
      return
    }
    if (!selectedEventId) {
      toast.error('Please select a target exam event.')
      return
    }

    startTransition(async () => {
      try {
        const res = await bookBundleExamsAtomicAction({
          moduleCodes: selectedModules,
          eventId: selectedEventId,
        })
        if (res.error) {
          toast.error(res.error)
          return
        }
        toast.success(
          `${label} booked successfully! ${bundleSize} exam seats reserved.`
        )
        setOpen(false)
        setSelectedModules([])
      } catch {
        toast.error('Something went wrong. Please try again.')
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
          className={`flex items-center justify-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-bold transition-all active:scale-95 ${
            bundleSize === 2
              ? 'border-blue-200 bg-blue-50/50 text-blue-700 hover:border-blue-300 hover:bg-blue-100/50 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
              : 'border-purple-200 bg-purple-50/50 text-purple-700 hover:border-purple-300 hover:bg-purple-100/50 dark:border-purple-800 dark:bg-purple-900/20 dark:text-purple-300'
          }`}
        >
          <span className="hidden sm:inline">{label}</span>
          <span className="sm:hidden">{shortLabel}</span>
          <span className="text-xs opacity-70">
            ({currencySymbol}
            {bundlePrice.toFixed(2)})
          </span>
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
            aria-labelledby="bundle-booking-title"
            onKeyDown={(e) => { if (e.key === 'Escape' && !isPending) setOpen(false) }}
            className="relative z-10 w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-8 py-6 dark:border-slate-800">
              <div>
                <h2 id="bundle-booking-title" className="text-xl font-black tracking-tight text-blue-800 dark:text-white">
                   {label}
                </h2>
                <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                  Select {bundleSize} modules for your bundle.
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
              {/* Pricing Summary */}
              <div className="flex items-center gap-4 rounded-2xl border border-blue-100 bg-blue-50/50 p-5 dark:border-blue-800 dark:bg-blue-900/20">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400">
                  <Package className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                    Total Bundle Price
                  </p>
                  <p className="mt-1 text-xl font-black text-slate-900 dark:text-white">
                    {currencySymbol}{bundlePrice.toFixed(2)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="mb-1 inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black tracking-tight text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400 uppercase">
                    Save {currencySymbol}{savings.toFixed(2)}
                  </p>
                  <p className="text-xs font-medium text-slate-500">
                    Just {currencySymbol}{(bundlePrice / bundleSize).toFixed(0)}/seat
                  </p>
                </div>
              </div>

              {/* Event Selection */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-tight">
                  <Calendar className="h-4 w-4 text-blue-800" />
                  Target Exam Event
                </label>
                <select
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  disabled={isPending}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm font-bold text-slate-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="">-- Select an event --</option>
                  {events.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Module Selection */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-tight">
                  <BookOpen className="h-4 w-4 text-aerojet-blue" />
                  Select {bundleSize} Modules ({selectedModules.length}/{bundleSize})
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {examComponents.map((ec) => {
                    const isSelected = selectedModules.includes(ec.code)
                    const isDisabled =
                      !isSelected && selectedModules.length >= bundleSize

                    return (
                      <button
                        key={ec.id}
                        type="button"
                        onClick={() => toggleModule(ec.code)}
                        disabled={isDisabled || isPending}
                        className={`group relative rounded-xl border p-3 text-left transition-all ${
                          isSelected
                            ? 'border-blue-800 bg-blue-50/50 dark:border-blue-500 dark:bg-blue-900/20'
                            : isDisabled
                              ? 'opacity-40 cursor-not-allowed border-slate-100 dark:border-slate-800'
                              : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:hover:border-slate-600 dark:hover:bg-slate-800/50 shadow-sm'
                        }`}
                      >
                        <p className={`text-xs font-black tracking-tighter uppercase ${isSelected ? 'text-blue-800 dark:text-blue-300' : 'text-slate-900 dark:text-slate-100'}`}>
                          {ec.courseCode ? `${ec.courseCode} - ` : ''}{ec.code}
                        </p>
                        <p className="mt-0.5 line-clamp-1 text-[10px] font-medium text-slate-500 dark:text-slate-400">
                          {ec.name}{ec.categoryCode ? ` - Cat ${ec.categoryCode}` : ''}
                        </p>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Info note */}
              <div className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/30">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                <p className="text-[10px] font-medium leading-relaxed text-slate-500 dark:text-slate-400">
                  Bundle seats are auto-assigned to pools by the enrollment deadline. You can update your module selection from the <strong>My Bookings</strong> tab before the deadline.
                </p>
              </div>

              {!canAfford && (
                <div className="flex items-start gap-4 rounded-2xl border border-amber-100 bg-amber-50/50 p-5 dark:border-amber-900/30 dark:bg-amber-900/20">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400">
                    <Wallet className="h-5 w-5" />
                  </div>
                  <div className="text-xs font-medium leading-relaxed text-amber-800 dark:text-amber-300">
                    <p className="mb-1 font-black uppercase tracking-tight">Insufficient Wallet Balance</p>
                    Your current balance is <strong>{currencySymbol}{availableBalance.toFixed(2)}</strong>. You need an additional <strong>{currencySymbol}{(bundlePrice - availableBalance).toFixed(2)}</strong> to complete this purchase.
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
                  disabled={
                    isPending ||
                    !canAfford ||
                    selectedModules.length !== bundleSize ||
                    !selectedEventId
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
                      Complete Purchase
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
