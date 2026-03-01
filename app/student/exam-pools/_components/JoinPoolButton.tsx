'use client'

import { useState, useTransition } from 'react'
import { joinExamPool } from '@/app/student/actions'
import { toast } from 'sonner'
import { Loader2, ArrowRight, BookOpen, Wallet, AlertCircle, CheckCircle2, X } from 'lucide-react'
import { getCurrencySymbol } from '@/lib/currency'

// All EASA Part-66 module options
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

interface JoinPoolButtonProps {
  poolId: string
  poolName: string
  price: number
  currency: string
  canAfford: boolean
  availableBalance: number
  currentModules: string[] // modules already in pool
  isFull: boolean
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
}: JoinPoolButtonProps) {
  const [open, setOpen] = useState(false)
  const [selectedModule, setSelectedModule] = useState('')
  const [isPending, startTransition] = useTransition()

  const currencySymbol = getCurrencySymbol(currency)
  const moduleCount = currentModules.length
  const atModuleCap = moduleCount >= 4

  // Determine which modules are available for selection
  const availableModules = EASA_MODULES.filter((m) => {
    // If this module is already in the pool, always allow it (not adding a new slot)
    if (currentModules.includes(m.code)) return true
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
        Pool Full
      </button>
    )
  }

  if (!canAfford) {
    return (
      <button
        disabled
        className="cursor-not-allowed rounded-xl bg-amber-50 px-4 py-2 text-xs font-bold tracking-wide text-amber-500 uppercase"
      >
        Insufficient Funds
      </button>
    )
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-xl bg-[#002a5c] px-4 py-2 text-xs font-bold tracking-wide text-white uppercase transition-all hover:bg-[#003a7c] active:scale-95"
      >
        Reserve Seat
        <ArrowRight className="h-3.5 w-3.5" />
      </button>

      {/* Module Selection Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => !isPending && setOpen(false)}
          />

          {/* Modal */}
          <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5 dark:border-slate-800">
              <div>
                <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-slate-100">
                  Reserve Exam Seat
                </h2>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{poolName}</p>
              </div>
              <button
                onClick={() => !isPending && setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-5 p-6">
              {/* Wallet balance */}
              <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4 dark:bg-slate-800">
                <Wallet className="h-5 w-5 text-[#4c9ded]" />
                <div>
                  <p className="text-xs font-bold tracking-widest text-slate-500 uppercase dark:text-slate-400">
                    Available Balance
                  </p>
                  <p className="text-base font-black text-slate-900 dark:text-slate-100">
                    {currencySymbol}
                    {availableBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-xs font-bold tracking-widest text-slate-500 uppercase dark:text-slate-400">
                    Seat Price
                  </p>
                  <p className="text-base font-black text-[#002a5c] dark:text-blue-400">
                    {currencySymbol}
                    {price.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Module Selection */}
              <div>
                <label className="mb-2 flex items-center gap-1.5 text-sm font-bold text-slate-700 dark:text-slate-300">
                  <BookOpen className="h-4 w-4" />
                  Select Your EASA Module
                </label>

                {atModuleCap && (
                  <div className="mb-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-400">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>
                      This pool is at the 4-module cap. You can only join for:{' '}
                      <strong>{currentModules.join(', ')}</strong>
                    </span>
                  </div>
                )}

                <select
                  value={selectedModule}
                  onChange={(e) => setSelectedModule(e.target.value)}
                  disabled={isPending}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 shadow-sm focus:border-[#4c9ded] focus:ring-2 focus:ring-[#4c9ded]/20 focus:outline-none disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                >
                  <option value="">— Choose a module —</option>
                  {availableModules.map((m) => (
                    <option key={m.code} value={m.code}>
                      {m.code} — {m.name}
                      {currentModules.includes(m.code) ? ' (already in pool)' : ''}
                    </option>
                  ))}
                </select>
                <p className="mt-1.5 text-[11px] text-slate-400 dark:text-slate-500">
                  Each candidate takes exactly one module per pool seat. Modules already listed are
                  shared with other candidates in this pool.
                </p>
              </div>

              {/* Pool Module Summary */}
              {currentModules.length > 0 && (
                <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/50">
                  <p className="mb-2 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                    Current Pool Modules ({moduleCount}/4 slots used)
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {currentModules.map((m) => (
                      <span
                        key={m}
                        className="inline-flex rounded-lg bg-[#002a5c]/10 px-2.5 py-1 text-xs font-bold text-[#002a5c] dark:bg-blue-900/30 dark:text-blue-300"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Confirmation notice */}
              <div className="flex items-start gap-2 rounded-lg border border-blue-100 bg-blue-50/50 p-3 text-xs text-blue-700 dark:border-blue-900 dark:bg-blue-900/20 dark:text-blue-400">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  <strong>
                    {currencySymbol}
                    {price.toFixed(2)}
                  </strong>{' '}
                  will be reserved from your wallet. Funds are released automatically if the pool is
                  cancelled.
                </span>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => !isPending && setOpen(false)}
                  disabled={isPending}
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={isPending || !selectedModule}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#002a5c] px-4 py-3 text-sm font-bold text-white transition-all hover:bg-[#003a7c] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Reserving...
                    </>
                  ) : (
                    <>
                      Reserve Seat
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
