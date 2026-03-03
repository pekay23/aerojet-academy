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
      <div
        style={{
          padding: '12px',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '8px',
          marginTop: '8px',
        }}
      >
        <p style={{ fontSize: '13px', color: '#fca5a5', margin: '0 0 8px' }}>
          Withdraw from <strong>{poolName}</strong>?
          {amountReserved > 0 && ` €${amountReserved} will be released back to your wallet.`}
        </p>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleWithdraw}
            disabled={isLoading}
            style={{
              padding: '6px 16px',
              background: '#ef4444',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: isLoading ? 'wait' : 'pointer',
              fontSize: '12px',
              fontWeight: 600,
            }}
          >
            {isLoading ? 'Withdrawing...' : 'Confirm Withdraw'}
          </button>
          <button
            onClick={() => setIsConfirming(false)}
            disabled={isLoading}
            style={{
              padding: '6px 16px',
              background: 'transparent',
              color: '#888',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
            }}
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
      style={{
        padding: '6px 12px',
        background: 'transparent',
        color: '#ef4444',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '12px',
        transition: 'all 0.2s',
      }}
      onMouseEnter={(e) => {
        ;(e.target as HTMLElement).style.background = 'rgba(239, 68, 68, 0.1)'
      }}
      onMouseLeave={(e) => {
        ;(e.target as HTMLElement).style.background = 'transparent'
      }}
    >
      Leave Pool
    </button>
  )
}
