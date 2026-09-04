'use client'

import { useState, useTransition } from 'react'
import { setReferrerAction } from '@/app/student/actions'
import { toast } from 'sonner'
import { Loader2, ArrowRight } from 'lucide-react'

export default function SetReferrerForm() {
  const [input, setInput] = useState('')
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input) {
      toast.error('Please enter an email or referral code.')
      return
    }

    startTransition(async () => {
      try {
        const res = await setReferrerAction(input)

        if (res?.error) {
          toast.error(res.error)
        } else {
          toast.success('Referrer set successfully!')
          setInput('')
        }
      } catch (_err) {
        toast.error('Something went wrong. Please try again.')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <input
        type="text"
        placeholder="Email or Referral Code"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        disabled={isPending}
        required
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium outline-none transition-all focus:border-blue-800 focus:ring-4 focus:ring-blue-800/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
      />
      <button
        type="submit"
        disabled={isPending || !input}
        className="flex items-center justify-center gap-2 rounded-xl bg-blue-800 py-3 text-sm font-bold text-white shadow-lg transition-all hover:bg-[#003a7c] active:scale-95 disabled:opacity-50"
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Set Referrer'}
        <ArrowRight className="h-4 w-4" />
      </button>
    </form>
  )
}
