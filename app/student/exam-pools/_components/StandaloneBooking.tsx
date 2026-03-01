'use client'

import { useState, useTransition } from 'react'
import { bookStandaloneExamAction } from '@/app/student/actions'
import { toast } from 'sonner'
import { Loader2, ArrowRight, BookOpen, Wallet, CheckCircle2, X } from 'lucide-react'

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

interface StandaloneBookingProps {
  price: number
  currency: string
  availableBalance: number
}

export default function StandaloneBooking({
  price,
  currency,
  availableBalance,
}: StandaloneBookingProps) {
  const [open, setOpen] = useState(false)
  const [selectedModuleId, setSelectedModuleId] = useState('')
  const [isPending, startTransition] = useTransition()

  const currencySymbol = currency === 'GHS' ? 'GH₵' : '€'
  const canAfford = availableBalance >= price

  const handleConfirm = () => {
    if (!selectedModuleId) {
      toast.error('Please select an exam before booking.')
      return
    }

    startTransition(async () => {
      try {
        // In a real scenario, we would search for an Exam ID matching the module code.
        // For this demo/impl, we'll assume the action handles finding the next available exam for that module.
        // Alternatively, the admin provides specific Exam IDs.
        // For now, I'll pass the selectedModuleId as if it's the examId (placeholder logic till dynamic search is better).
        const res = await bookStandaloneExamAction(selectedModuleId)
        if (res.error) {
          toast.error(res.error)
        } else {
          toast.success(
            `Exam booked successfully! ${currencySymbol}${price.toFixed(2)} charged from your wallet.`
          )
          setOpen(false)
          setSelectedModuleId('')
        }
      } catch {
        toast.error('Something went wrong. Please try again.')
      }
    })
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full rounded-xl border border-slate-200 bg-white py-3 text-sm font-bold text-slate-700 transition-all hover:border-blue-300 hover:bg-blue-50/50 active:scale-95 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
      >
        Book Standalone Individual Seat (€{price.toFixed(2)})
      </button>

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
                  Fixed pricing for immediate seat confirmation.
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
                    {price.toFixed(2)}
                  </p>
                </div>
              </div>

              <div>
                <label className="mb-2 flex items-center gap-1.5 text-sm font-bold text-slate-700 dark:text-slate-300">
                  <BookOpen className="h-4 w-4" />
                  Select Module Exam
                </label>
                <select
                  value={selectedModuleId}
                  onChange={(e) => setSelectedModuleId(e.target.value)}
                  disabled={isPending}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                >
                  <option value="">— Choose a module exam —</option>
                  {EASA_MODULES.map((m) => (
                    <option key={m.code} value={m.code}>
                      {m.code} — {m.name}
                    </option>
                  ))}
                </select>
              </div>

              {!canAfford && (
                <div className="rounded-lg bg-amber-50 p-3 text-xs text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
                  Insufficient funds to book a standalone seat. Please top up your wallet.
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setOpen(false)}
                  className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-bold text-slate-700 dark:border-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={isPending || !selectedModuleId || !canAfford}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#002a5c] py-3 text-sm font-bold text-white hover:bg-[#003a7c] active:scale-95 disabled:opacity-50"
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
