'use client'

import { useState } from 'react'
import { RefreshCw, Loader2 } from 'lucide-react'
import { triggerRedistribution } from './actions'
import { toast } from 'sonner'

interface Props {
  eventId: string
}

export default function RedistributePoolButton({ eventId }: Props) {
  const [loading, setLoading] = useState(false)

  const handleRedistribute = async () => {
    if (!confirm('This will move students from the Auto Pool into Standard Pools (A-D) based on availability and module diversity. Continue?')) {
      return
    }

    setLoading(true)
    try {
      const result = await triggerRedistribution(eventId)
      if (result.success) {
        toast.success(result.message)
      } else {
        toast.error(result.error)
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleRedistribute}
      disabled={loading}
      className="flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm font-bold text-indigo-700 transition-colors hover:bg-indigo-100 dark:border-indigo-900/50 dark:bg-indigo-950/30 dark:text-indigo-400"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <RefreshCw className="h-4 w-4" />
      )}
      Redistribute Auto Pool
    </button>
  )
}
