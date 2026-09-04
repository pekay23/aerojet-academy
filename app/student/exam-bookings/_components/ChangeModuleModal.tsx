'use client'

import { useState, useTransition } from 'react'
import { changeModuleBookingAction } from '@/app/student/actions'
import { toast } from 'sonner'
import { Loader2, Repeat, X } from 'lucide-react'
import { EASA_MODULES } from '@/lib/constants/easa-modules'

interface ChangeModuleModalProps {
  bookingId: string
  currentModuleCode: string
  hasFreeChanges: boolean
}

export default function ChangeModuleModal({ bookingId, currentModuleCode, hasFreeChanges }: ChangeModuleModalProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [newModuleCode, setNewModuleCode] = useState('')

  const availableModules = EASA_MODULES.filter(m => m.code !== currentModuleCode)

  const handleSubmit = () => {
    if (!newModuleCode) {
      toast.error('Please select a new module.')
      return
    }

    startTransition(async () => {
      try {
        const res = await changeModuleBookingAction(bookingId, newModuleCode)

        if (res?.error) {
          toast.error(res.error)
        } else {
          toast.success(`Module successfully changed to ${newModuleCode}.`)
          setOpen(false)
        }
      } catch (_err) {
        toast.error('Something went wrong. Please try again.')
      }
    })
  }

  if (!hasFreeChanges) return null

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition-all hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        <Repeat className="h-3.5 w-3.5" />
        Change Module (Free)
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
            className="relative z-10 w-full max-w-sm overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5 dark:border-slate-800">
              <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-slate-100">
                Change Module
              </h2>
              <button
                onClick={() => !isPending && setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 p-6">
              <p className="text-xs text-slate-500">
                You have a free module change available from your Exam Package. 
                Select a new module to swap <strong>{currentModuleCode}</strong> with.
              </p>

              <div>
                <label className="mb-2 block text-xs font-bold text-slate-700 dark:text-slate-300">
                  New Module
                </label>
                <select
                  value={newModuleCode}
                  onChange={(e) => setNewModuleCode(e.target.value)}
                  disabled={isPending}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800"
                >
                  <option value="">— Select new module —</option>
                  {availableModules.map((m) => (
                    <option key={m.code} value={m.code}>
                      {m.code} — {m.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="border-t border-slate-100 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-900/50">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={isPending}
                  className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isPending || !newModuleCode}
                  className="flex flex-[1.5] items-center justify-center gap-2 rounded-xl bg-blue-800 py-2.5 text-sm font-bold text-white shadow-lg transition-all hover:bg-[#003a7c] active:scale-95 disabled:opacity-50"
                >
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm Change'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
