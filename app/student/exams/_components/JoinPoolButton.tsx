'use client'

import { useState, useTransition } from 'react'
import { joinExamPool } from '@/app/student/actions'
import { toast } from 'sonner'
import { Loader2, ArrowRight, BookOpen, AlertCircle, CheckCircle2, X } from 'lucide-react'
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

interface JoinPoolButtonProps {
  poolId: string
  poolName: string
  price: number
  currency: string
  canAfford: boolean
  availableBalance: number
  currentModules: string[] // modules already in pool
  isFull: boolean
  examComponents: ExamComponent[]
}

export default function JoinPoolButton({
  poolId,
  poolName,
  price,
  currency,
  canAfford,
  availableBalance,
  currentModules,
  isFull,
  examComponents,
}: JoinPoolButtonProps) {
  const [open, setOpen] = useState(false)
  const [selectedModule, setSelectedModule] = useState('')
  const [isPending, startTransition] = useTransition()

  const currencySymbol = getCurrencySymbol(currency)
  const moduleCount = currentModules.length
  const atModuleCap = moduleCount >= 4

  // Determine which modules are available for selection
  const availableModules = examComponents.filter((m) => {
    // If this module is already in the pool, always allow it (not adding a new slot)
    if (currentModules.includes(m.courseCode || m.code)) return true
    // If the pool's module cap is full, only allow existing modules
    if (atModuleCap) return false
    return true
  })

  const handleConfirm = () => {
    if (!selectedModule) {
      toast.error('Please select a module before reserving your seat.')
      return
    }

    startTransition(async () => {
      try {
        const res = await joinExamPool(poolId, selectedModule)
        if (res.error) {
          toast.error(res.error)
        } else {
          toast.success(
            `Seat reserved in ${poolName}! ${currencySymbol}${price.toFixed(2)} held from your wallet.`
          )
          setOpen(false)
          setSelectedModule('')
        }
      } catch {
        toast.error('Something went wrong. Please try again.')
      }
    })
  }

  if (isFull) {
    return (
      <button
        disabled
        className="cursor-not-allowed rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold tracking-wide text-slate-400 uppercase"
      >
        Booking Full
      </button>
    )
  }

  if (!canAfford) {
    return (
      <button
        disabled
        className="cursor-not-allowed rounded-xl bg-amber-50 px-4 py-2 text-xs tracking-wide text-amber-500 uppercase font-black"
      >
        Insufficient Funds
      </button>
    )
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-xl bg-blue-800 px-4 py-2 text-xs font-bold tracking-wide text-white uppercase transition-all hover:bg-[#003a7c] active:scale-95 shadow-sm hover:shadow-md"
      >
        Reserve Seat
        <ArrowRight className="h-3.5 w-3.5" />
      </button>

      {/* Module Selection Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => !isPending && setOpen(false)}
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="join-pool-title"
            onKeyDown={(e) => { if (e.key === 'Escape' && !isPending) setOpen(false) }}
            className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900 border border-slate-100 dark:border-slate-800"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5 dark:border-slate-800">
              <div>
                <h2 id="join-pool-title" className="text-lg font-black tracking-tight text-blue-800 dark:text-white">
                  Reserve Exam Seat
                </h2>
                <p className="mt-0.5 text-xs font-medium text-slate-500 dark:text-slate-400">{poolName}</p>
              </div>
              <button
                onClick={() => !isPending && setOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-700 dark:hover:bg-slate-800 transition-colors"
                disabled={isPending}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6 p-6">
              {/* Pricing & Balance Overview */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Available Funds</p>
                  <p className="mt-1 text-lg font-black text-slate-900 dark:text-white">
                    {currencySymbol}{availableBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="rounded-xl bg-blue-50 p-4 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/50">
                  <p className="text-[10px] font-black tracking-widest text-blue-400 uppercase">Seat Price</p>
                  <p className="mt-1 text-lg font-black text-blue-800 dark:text-blue-300">
                    {currencySymbol}{price.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Module Selection */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-tight">
                  <BookOpen className="h-4 w-4 text-blue-800" />
                  Select EASA Module Exam
                </label>

                {atModuleCap && (
                  <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-700 dark:border-amber-800/50 dark:bg-amber-900/20 dark:text-amber-400 shadow-sm">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                    <span>
                      This booking is at the 4-module cap. You can only join for:{' '}
                      <span className="font-bold">{currentModules.join(', ')}</span>
                    </span>
                  </div>
                )}

                <div className="relative group">
                  <select
                    value={selectedModule}
                    onChange={(e) => setSelectedModule(e.target.value)}
                    disabled={isPending}
                    className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-4 text-sm font-bold text-slate-900 shadow-sm transition-all focus:border-blue-800 focus:ring-4 focus:ring-blue-800/5 outline-none disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="">— Choose a module —</option>
                    {availableModules.map((m) => (
                      <option key={m.code} value={m.code}>
                        {m.courseCode ? `${m.courseCode} - ` : ''}{m.code} - {m.name}
                        {m.categoryCode ? ` - Cat ${m.categoryCode}` : ''}
                        {currentModules.includes(m.courseCode || m.code) ? ' (Already in pool)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-[10px] font-medium leading-relaxed text-slate-400 dark:text-slate-500">
                  Candidates take exactly one module per seat. Modules shown are based on the current pool composition and slot availability.
                </p>
              </div>

              {/* Pool Composition Summary */}
              {currentModules.length > 0 && (
                <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/30">
                  <p className="mb-2 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                    Current Pool Modules ({moduleCount}/4 unique)
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {currentModules.map((m) => (
                      <span
                        key={m}
                        className="inline-flex rounded-lg bg-white border border-slate-100 px-2.5 py-1 text-xs font-black text-blue-800 shadow-sm dark:bg-slate-800 dark:border-slate-700 dark:text-blue-300"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Wallet Reservation Notice */}
              <div className="flex items-start gap-3 rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 text-xs font-medium text-emerald-800 dark:border-emerald-900/30 dark:bg-emerald-900/10 dark:text-emerald-400">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                <span>
                  By confirming, <strong>{currencySymbol}{price.toFixed(2)}</strong> will be held from your wallet. 
                  Funds are released automatically if the booking is cancelled or not confirmed.
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-2">
                <button
                  onClick={() => !isPending && setOpen(false)}
                  disabled={isPending}
                  className="flex-1 rounded-xl border border-slate-200 bg-white py-4 text-sm font-black text-slate-700 transition-all hover:bg-slate-50 hover:border-slate-300 active:scale-95 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={isPending || !selectedModule}
                  className="flex flex-[1.5] items-center justify-center gap-2 rounded-xl bg-blue-800 py-4 text-sm font-black text-white shadow-lg shadow-blue-800/20 transition-all hover:bg-[#003a7c] hover:shadow-xl active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Reserving...
                    </>
                  ) : (
                    <>
                      Confirm Reservation
                      <ArrowRight className="h-4 w-4" />
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
