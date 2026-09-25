'use client'

import { useState, useEffect } from 'react'

interface BundlePricing {
  price: number
  seats: number
  perSeat: number
  savings: number
}

export function BundlePurchaseCard() {
  const [pricing, setPricing] = useState<{ twoSeat?: BundlePricing; fourSeat?: BundlePricing }>({})
  const [isLoading, setIsLoading] = useState(true)
  const [purchasing, setPurchasing] = useState<string | null>(null)

  const fetchPricing = async () => {
    try {
      const res = await fetch('/api/applicant/exam-only/pricing')
      const data = await res.json()
      setPricing(data.bundles || {})
    } catch {
      console.error('Failed to load pricing')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPricing()
  }, [])

  const handlePurchase = async (bundleType: 'TWO_SEAT' | 'FOUR_SEAT') => {
    if (!confirm(`Purchase ${bundleType === 'TWO_SEAT' ? '2-Seat' : '4-Seat'} bundle?`)) return
    setPurchasing(bundleType)
    try {
      const res = await fetch('/api/applicant/exam-only/bundles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bundleType }),
      })
      const data = await res.json()
      if (data.success) {
        alert(data.message || 'Bundle purchased!')
        window.location.reload()
      } else {
        alert(data.error || 'Purchase failed')
      }
    } catch {
      alert('Network error')
    } finally {
      setPurchasing(null)
    }
  }

  if (isLoading) {
    return <div className="p-5 text-center text-[#888]">Loading bundles...</div>
  }

  const bundles = [
    {
      type: 'TWO_SEAT' as const,
      label: '2-Seat Bundle',
      data: pricing.twoSeat,
      gradientClass: 'bg-[linear-gradient(135deg,#1e3a5f,#2563eb)]',
      icon: '🎟️',
    },
    {
      type: 'FOUR_SEAT' as const,
      label: '4-Seat Bundle',
      data: pricing.fourSeat,
      gradientClass: 'bg-[linear-gradient(135deg,#1e3a5f,#7c3aed)]',
      icon: '🎫',
      badge: '+ 1 free module change',
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-4">
      {bundles.map((b) => (
        <div
          key={b.type}
          className={`p-5 ${b.gradientClass} relative overflow-hidden rounded-xl border border-white/10`}
        >
          {b.badge && (
            <div className="absolute top-2 -right-5 rotate-45 bg-[#10b981] px-7.5 py-0.5 text-[9px] font-bold text-white uppercase">
              Bonus
            </div>
          )}

          <div className="mb-2 text-2xl">{b.icon}</div>
          <h4 className="m-0 mb-1 text-base font-bold text-white">{b.label}</h4>
          <div className="my-2 text-[28px] font-extrabold text-white">€{b.data?.price || '–'}</div>
          <div className="mb-1 text-xs text-white/70">
            {b.data?.seats || '–'} exam seats • €{b.data?.perSeat || '–'}/seat
          </div>
          {b.data?.savings ? (
            <div className="mb-3 text-xs font-semibold text-[#34d399]">
              Save €{b.data.savings} vs individual pool seats
            </div>
          ) : (
            <div className="mb-3 h-3" />
          )}
          {b.badge && <div className="mb-3 text-[11px] text-[#a5f3fc]">{b.badge}</div>}
          <div className="mb-3 text-[11px] text-white/50">Valid for 12 months • Any modules</div>
          <button
            onClick={() => handlePurchase(b.type)}
            disabled={purchasing !== null}
            className={`w-full rounded-lg border border-white/20 bg-white/15 py-2.5 text-[13px] font-semibold text-white transition-all duration-200 hover:bg-white/25 ${purchasing ? 'cursor-wait' : 'cursor-pointer'}`}
          >
            {purchasing === b.type ? 'Processing...' : 'Purchase Bundle'}
          </button>
        </div>
      ))}
    </div>
  )
}
