'use client'

import { useState, useTransition } from 'react'
import { bookStandaloneExamAction } from '@/app/student/actions'
import { toast } from 'sonner'
import { Loader2, ArrowRight, BookOpen, Wallet, Calendar, X, Package, Info } from 'lucide-react'
import { getCurrencySymbol } from '@/lib/currency'

const EASA_MODULES = [
  { code: 'M1', name: 'Mathematics' },
  { code: 'M2', name: 'Physics' },
  { code: 'M3', name: 'Electrical Fundamentals' },
  { code: 'M4', name: 'Electronic Fundamentals' },
  { code: 'M5', name: 'Digital Techniques / Avionics' },
  { code: 'M6', name: 'Materials & Hardware' },
  { code: 'M7A', name: 'Maintenance Practices' },
  { code: 'M7B', name: 'Maintenance Practices (Avionics)' },
  { code: 'M8', name: 'Basic Aerodynamics' },
  { code: 'M9A', name: 'Human Factors' },
  { code: 'M10', name: 'Aviation Legislation' },
  { code: 'M11A', name: 'Aeroplane Aerodynamics (Turbine)' },
  { code: 'M11B', name: 'Aeroplane Aerodynamics (Piston)' },
  { code: 'M12', name: 'Helicopter Aerodynamics' },
  { code: 'M13', name: 'Aircraft Aerodynamics (Structures)' },
  { code: 'M14', name: 'Propulsion' },
  { code: 'M15', name: 'Gas Turbine Engine' },
  { code: 'M16', name: 'Piston Engine' },
  { code: 'M17A', name: 'Propeller' },
]

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
  trigger?: React.ReactNode
}

export default function BundleBooking({
  bundleSize,
  bundlePrice,
  individualPrice,
  currency,
  availableBalance,
  events,
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
        // Book each module in the bundle
        for (const moduleCode of selectedModules) {
          const res = await bookStandaloneExamAction({
            moduleCode,
            eventId: selectedEventId,
          })
          if (res.error) {
            toast.error(`Error booking ${moduleCode}: ${res.error}`)
            return
          }
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
          <Package className="h-4 w-4" />
          <span className="hidden sm:inline">{label}</span>
          <span className="sm:hidden">{shortLabel}</span>
          <span className="text-xs opacity-70">
            ({currencySymbol}
            {bundlePrice.toFixed(0)})
          </span>
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => !isPending && setOpen(false)}
          />

          <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-8 py-6 dark:border-slate-800">
              <div>
                <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-slate-100">
                  Book {label}
                </h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Select {bundleSize} modules for your bundle. Valid for 12 months.
                </p>
              </div>
              <button
                onClick={() => !isPending && setOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[70vh] space-y-6 overflow-y-auto p-8">
              {/* Pricing Summary */}
              <div className="flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-5 dark:border-blue-800 dark:bg-blue-900/20">
                <Wallet className="h-6 w-6 text-blue-600" />
                <div className="flex-1">
                  <p className="text-xs font-bold tracking-widest text-slate-500 uppercase">
                    Bundle Price
                  </p>
                  <p className="mt-1 text-lg font-black leading-none text-slate-900 dark:text-slate-100">
                    {currencySymbol}
                    {bundlePrice.toFixed(2)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="mb-1 inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400">
                    Save {currencySymbol}
                    {savings.toFixed(0)}
                  </p>
                  <p className="text-xs text-slate-500">
                    vs {currencySymbol}
                    {individualPrice.toFixed(0)}/seat
                  </p>
                </div>
              </div>

              {/* Event Selection */}
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">
                  Target Exam Event
                </label>
                <select
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  disabled={isPending}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                >
                  <option value="">-- Select an event --</option>
                  {events.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name} ({new Date(e.startDate).toLocaleDateString()} -{' '}
                      {new Date(e.endDate).toLocaleDateString()})
                    </option>
                  ))}
                </select>
              </div>

              {/* Module Selection */}
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">
                  Select {bundleSize} Modules ({selectedModules.length}/{bundleSize})
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {EASA_MODULES.map((m) => {
                    const isSelected = selectedModules.includes(m.code)
                    const isDisabled =
                      !isSelected && selectedModules.length >= bundleSize

                    return (
                      <button
                        key={m.code}
                        type="button"
                        onClick={() => toggleModule(m.code)}
                        disabled={isDisabled || isPending}
                        className={`rounded-xl border px-3 py-2 text-left text-xs font-medium transition-all ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50 text-blue-700 dark:border-blue-500 dark:bg-blue-900/20 dark:text-blue-300'
                            : isDisabled
                              ? 'cursor-not-allowed border-slate-100 text-slate-300 dark:border-slate-800 dark:text-slate-600'
                              : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50 dark:border-slate-700 dark:hover:border-blue-700 dark:hover:bg-slate-800'
                        }`}
                      >
                        <span className="font-bold">{m.code}</span>{' '}
                        <span className="text-[10px] opacity-70">{m.name}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Info note */}
              <div className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                  Bundle seats can be used for any exam events within 12 months of purchase. You can
                  assign modules to specific dates later.
                </p>
              </div>

              {!canAfford && (
                <div className="flex gap-3 rounded-2xl border border-amber-100 bg-amber-50 p-4 dark:border-amber-900/30 dark:bg-amber-900/20">
                  <Info className="h-5 w-5 shrink-0 text-amber-600" />
                  <div className="text-xs leading-relaxed text-amber-800 dark:text-amber-400">
                    <p className="mb-1 font-bold">Insufficient Wallet Balance</p>
                    You need {currencySymbol}
                    {bundlePrice.toFixed(2)} but only have {currencySymbol}
                    {availableBalance.toFixed(2)} available.
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
                  className="flex-1 rounded-2xl border border-slate-200 bg-white py-4 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
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
                  className="flex flex-[1.5] items-center justify-center gap-2 rounded-2xl bg-[#002a5c] py-4 text-sm font-bold text-white shadow-lg shadow-blue-900/20 hover:bg-[#003a7c] active:scale-95 disabled:opacity-50"
                >
                  {isPending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      Book {label}
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
