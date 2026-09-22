'use client'

import { useRouter } from 'next/navigation'
import { RefreshCw } from 'lucide-react'

export function RefreshAnalyticsButton() {
  const router = useRouter()

  return (
    <button
      onClick={() => router.refresh()}
      className="bg-aerojet-blue hover:bg-aerojet-blue/90 mt-8 flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-black text-white shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
    >
      <RefreshCw className="h-4 w-4" />
      Refresh Analytics
    </button>
  )
}
