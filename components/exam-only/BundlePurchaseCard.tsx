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

  useEffect(() => {
    fetchPricing()
  }, [])

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
    return (
      <div className="p-5 text-center text-[#888]">Loading bundles...</div>
    )
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
          className={`p-5 ${b.gradientClass} rounded-xl border border-white/10 relative overflow-hidden`}
        >
          {b.badge && (
            <div className="absolute top-2 -right-5 rotate-45 bg-[#10b981] text-white text-[9px] font-bold py-0.5 px-[30px] uppercase">
              Bonus
            </div>
          )}

          <div className="text-2xl mb-2">{b.icon}</div>
          <h4 className="text-base font-bold text-white m-0 mb-1">
            {b.label}
          </h4>
          <div className="text-[28px] font-extrabold text-white my-2">
            €{b.data?.price || '–'}
          </div>
          <div className="text-[12px] text-white/70 mb-1">
            {b.data?.seats || '–'} exam seats • €{b.data?.perSeat || '–'}/seat
          </div>
          {b.data?.savings ? (
            <div className="text-[12px] text-[#34d399] font-semibold mb-3">
              Save €{b.data.savings} vs individual pool seats
            </div>
          ) : (
            <div className="h-3 mb-3" />
          )}
          {b.badge && (
            <div className="text-[11px] text-[#a5f3fc] mb-3">
              {b.badge}
            </div>
          )}
          <div className="text-[11px] text-white/50 mb-3">
            Valid for 12 months • Any modules
          </div>
          <button
            onClick={() => handlePurchase(b.type)}
            disabled={purchasing !== null}
            className={`w-full py-2.5 bg-white/15 text-white border border-white/20 rounded-lg font-semibold text-[13px] transition-all duration-200 hover:bg-white/25 ${purchasing ? 'cursor-wait' : 'cursor-pointer'}`}
          >
            {purchasing === b.type ? 'Processing...' : 'Purchase Bundle'}
          </button>
        </div>
      ))}
    </div>
  )
}
