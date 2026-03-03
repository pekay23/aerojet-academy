'use client'

import { useState } from 'react'

interface WithdrawButtonProps {
  poolId: string
  poolName: string
  amountReserved: number
  onSuccess?: () => void
}

export function WithdrawButton({
  poolId,
  poolName,
  amountReserved,
  onSuccess,
}: WithdrawButtonProps) {
  const [isConfirming, setIsConfirming] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleWithdraw = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/applicant/exam-only/withdraw-pool', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ poolId }),
      })
      const data = await res.json()
      if (data.success) {
        setIsConfirming(false)
        onSuccess?.()
      } else {
        alert(data.error || 'Failed to withdraw')
      }
    } catch {
      alert('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isConfirming) {
    return (
      <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg mt-2">
        <p className="text-[13px] text-red-300 m-0 mb-2">
          Withdraw from <strong>{poolName}</strong>?
          {amountReserved > 0 && ` €${amountReserved} will be released back to your wallet.`}
        </p>
        <div className="flex gap-2">
          <button
            onClick={handleWithdraw}
            disabled={isLoading}
            className={`px-4 py-1.5 bg-red-500 text-white border-none rounded-md text-xs font-semibold ${isLoading ? 'cursor-wait' : 'cursor-pointer'}`}
          >
            {isLoading ? 'Withdrawing...' : 'Confirm Withdraw'}
          </button>
          <button
            onClick={() => setIsConfirming(false)}
            disabled={isLoading}
            className="px-4 py-1.5 bg-transparent text-[#888] border border-white/10 rounded-md cursor-pointer text-xs"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={() => setIsConfirming(true)}
      className="px-3 py-1.5 bg-transparent text-red-500 border border-red-500/30 rounded-md cursor-pointer text-xs transition-all duration-200 hover:bg-red-500/10"
    >
      Leave Pool
    </button>
  )
}
