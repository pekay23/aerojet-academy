'use client'

import { useState } from 'react'
import { Edit2, Check, X, Loader2 } from 'lucide-react'
import { updateRevenueTarget } from '../actions'

interface TargetRevenueEditorProps {
  initialAmount: number
  currency: string
}

export default function TargetRevenueEditor({ initialAmount, currency }: TargetRevenueEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [amount, setAmount] = useState(initialAmount.toString())
  const [isLoading, setIsLoading] = useState(false)

  const handleSave = async () => {
    setIsLoading(true)
    const result = await updateRevenueTarget(Number(amount))
    setIsLoading(false)
    if (result.success) {
      setIsEditing(false)
    } else {
      alert(result.error || 'Failed to update target')
    }
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <div className="relative">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
            {currency}
          </span>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="h-8 w-28 rounded-lg border border-slate-200 bg-white pl-6 pr-2 text-xs font-bold focus:border-aerojet-sky focus:outline-none dark:border-slate-700 dark:bg-slate-800"
            autoFocus
          />
        </div>
        <button
          onClick={handleSave}
          disabled={isLoading}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
        </button>
        <button
          onClick={() => setIsEditing(false)}
          disabled={isLoading}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    )
  }

  return (
    <div className="group flex items-center gap-2">
      <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
        Target: <span className="font-bold text-slate-600 dark:text-slate-300">{currency}{initialAmount.toLocaleString()}</span>
      </p>
      <button
        onClick={() => setIsEditing(true)}
        className="opacity-30 transition-opacity group-hover:opacity-100"
      >
        <Edit2 className="h-3 w-3 text-slate-400 hover:text-aerojet-sky" />
      </button>
    </div>
  )
}
