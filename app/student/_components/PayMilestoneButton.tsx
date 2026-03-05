'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Wallet, Loader2 } from 'lucide-react'

interface Props {
  milestoneId: string
  amount: number
  currency: string
  label: string
}

export default function PayMilestoneButton({ milestoneId, amount, currency, label }: Props) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handlePay = async () => {
    if (
      !confirm(
        `Are you sure you want to pay ${currency} ${amount.toLocaleString()} for ${label} using your wallet balance?`
      )
    ) {
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/student/milestones/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ milestoneId }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Failed to process payment.')
        return
      }

      toast.success('Payment successful!')
      router.refresh()
    } catch (error) {
      toast.error('A network error occurred.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handlePay}
      disabled={loading}
      className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-[10px] font-bold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
    >
      {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wallet className="h-3 w-3" />}
      Pay from Wallet
    </button>
  )
}
