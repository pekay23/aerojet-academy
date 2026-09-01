'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { RefreshCcw } from 'lucide-react'

export default function ExamError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error('Exam interface error:', error)
  }, [error])

  return (
    <div className="flex h-[calc(100vh-80px)] flex-col items-center justify-center gap-4 p-6">
      <h2 className="text-xl font-black text-slate-900 dark:text-white">Something went wrong</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        The exam interface encountered an unexpected error.
      </p>
      <Button onClick={reset} variant="outline">
        <RefreshCcw className="mr-2 h-4 w-4" />
        Try again
      </Button>
    </div>
  )
}
