'use client'

import { useState } from 'react'
import { CalendarDays, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { triggerSittingGeneration } from './actions'

interface Props {
  eventId: string
}

export default function GenerateSittingsButton({ eventId }: Props) {
  const [loading, setLoading] = useState(false)

  const handleGenerate = async () => {
    if (!confirm('Generate or refresh sitting assignments for this event? Final attendance-backed assignments will be preserved.')) {
      return
    }

    setLoading(true)
    try {
      const result = await triggerSittingGeneration(eventId)
      if (!result.success) {
        toast.error(result.error || 'Failed to generate sittings')
        return
      }
      toast.success(result.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleGenerate}
      disabled={loading}
      className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-bold text-emerald-700 transition-colors hover:bg-emerald-100 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-400"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarDays className="h-4 w-4" />}
      Generate Sittings
    </button>
  )
}
