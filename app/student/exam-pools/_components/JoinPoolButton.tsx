'use client'

import { useState } from 'react'
import { joinExamPool } from '@/app/student/actions'
import { toast } from 'sonner'
import { Loader2, ArrowRight } from 'lucide-react'
import { WalletConfirmModal } from '@/components/shared/WalletConfirmModal'

export default function JoinPoolButton({
  poolId,
  price,
  currency,
  canAfford,
}: {
  poolId: string
  price: number
  currency: string
  canAfford: boolean
}) {
  const [loading, setLoading] = useState(false)

  const handleJoin = async () => {
    if (!canAfford) {
      toast.error(`Insufficient funds. Please top up your wallet.`)
      return
    }

    setLoading(true)
    try {
      const res = await joinExamPool(poolId)
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success('Successfully reserved seat in exam pool!')
      }
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!canAfford) {
    return (
      <button
        disabled
        className="cursor-not-allowed rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold tracking-wide text-slate-400 uppercase"
      >
        Insufficient Funds
      </button>
    )
  }

  return (
    <WalletConfirmModal
      title="Reserve Exam Seat"
      description="You are about to reserve a seat in this exam pool. The seat price will be reserved from your wallet balance."
      amount={price}
      currency={currency}
      onConfirm={handleJoin}
      processing={loading}
    >
      <button
        disabled={loading}
        className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold tracking-wide text-white uppercase transition-all hover:bg-blue-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <>
            Reserve Seat
            <ArrowRight className="h-3.5 w-3.5" />
          </>
        )}
      </button>
    </WalletConfirmModal>
  )
}
