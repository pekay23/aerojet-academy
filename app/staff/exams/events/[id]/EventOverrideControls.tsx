'use client'

import { useState } from 'react'
import { setEventOverride } from './actions'
import { EventOverrideStatus } from '@prisma/client'
import { Shield, ChevronDown, CheckCircle2, XCircle, RotateCcw } from 'lucide-react'

interface Props {
  eventId: string
  currentOverride: EventOverrideStatus
}

export default function EventOverrideControls({ eventId, currentOverride }: Props) {
  const [isPending, setIsPending] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const handleOverride = async (status: EventOverrideStatus) => {
    setIsPending(true)
    try {
      await setEventOverride(eventId, status)
      setIsOpen(false)
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-bold text-amber-700 transition-all hover:bg-amber-100 disabled:opacity-50"
        disabled={isPending}
      >
        <Shield className="h-4 w-4" />
        Admin Override: {currentOverride !== 'NONE' ? currentOverride.replace('_', ' ') : 'None'}
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 z-50 mt-2 w-64 divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
          <div className="bg-slate-50 px-4 py-3 text-xs font-black tracking-widest text-slate-400 uppercase dark:bg-slate-800/50">
            Override Status
          </div>

          <button
            onClick={() => handleOverride('FORCE_GO')}
            className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 ${
              currentOverride === 'FORCE_GO'
                ? 'bg-green-50 text-green-700 dark:bg-green-900/20'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <div className="text-sm font-bold">Force GO</div>
          </button>

          <button
            onClick={() => handleOverride('FORCE_NO_GO')}
            className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 ${
              currentOverride === 'FORCE_NO_GO'
                ? 'bg-red-50 text-red-700 dark:bg-red-900/20'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            <XCircle className="h-5 w-5 text-red-500" />
            <div className="text-sm font-bold">Force NO-GO</div>
          </button>

          <button
            onClick={() => handleOverride('NONE')}
            className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 ${
              currentOverride === 'NONE'
                ? 'bg-slate-100 text-slate-900 dark:bg-slate-800'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            <RotateCcw className="h-5 w-5 text-slate-400" />
            <div className="text-sm font-bold">Standard Logic (Reset)</div>
          </button>
        </div>
      )}
    </div>
  )
}
