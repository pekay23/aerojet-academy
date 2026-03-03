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
      <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>Loading bundles...</div>
    )
  }

  const bundles = [
    {
      type: 'TWO_SEAT' as const,
      label: '2-Seat Bundle',
      data: pricing.twoSeat,
      gradient: 'linear-gradient(135deg, #1e3a5f, #2563eb)',
      icon: '🎟️',
    },
    {
      type: 'FOUR_SEAT' as const,
      label: '4-Seat Bundle',
      data: pricing.fourSeat,
      gradient: 'linear-gradient(135deg, #1e3a5f, #7c3aed)',
      icon: '🎫',
      badge: '+ 1 free module change',
    },
  ]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
      {bundles.map((b) => (
        <div
          key={b.type}
          style={{
            padding: '20px',
            background: b.gradient,
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.1)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {b.badge && (
            <div
              style={{
                position: 'absolute',
                top: '8px',
                right: '-20px',
                transform: 'rotate(45deg)',
                background: '#10b981',
                color: '#fff',
                fontSize: '9px',
                fontWeight: 700,
                padding: '2px 30px',
                textTransform: 'uppercase',
              }}
            >
              Bonus
            </div>
          )}

          <div style={{ fontSize: '24px', marginBottom: '8px' }}>{b.icon}</div>
          <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#fff', margin: '0 0 4px' }}>
            {b.label}
          </h4>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#fff', margin: '8px 0' }}>
            €{b.data?.price || '–'}
          </div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginBottom: '4px' }}>
            {b.data?.seats || '–'} exam seats • €{b.data?.perSeat || '–'}/seat
          </div>
          {b.data?.savings ? (
            <div
              style={{ fontSize: '12px', color: '#34d399', fontWeight: 600, marginBottom: '12px' }}
            >
              Save €{b.data.savings} vs individual pool seats
            </div>
          ) : (
            <div style={{ height: '12px', marginBottom: '12px' }} />
          )}
          {b.badge && (
            <div style={{ fontSize: '11px', color: '#a5f3fc', marginBottom: '12px' }}>
              {b.badge}
            </div>
          )}
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginBottom: '12px' }}>
            Valid for 12 months • Any modules
          </div>
          <button
            onClick={() => handlePurchase(b.type)}
            disabled={purchasing !== null}
            style={{
              width: '100%',
              padding: '10px',
              background: 'rgba(255,255,255,0.15)',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '8px',
              cursor: purchasing ? 'wait' : 'pointer',
              fontWeight: 600,
              fontSize: '13px',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              ;(e.target as HTMLElement).style.background = 'rgba(255,255,255,0.25)'
            }}
            onMouseLeave={(e) => {
              ;(e.target as HTMLElement).style.background = 'rgba(255,255,255,0.15)'
            }}
          >
            {purchasing === b.type ? 'Processing...' : 'Purchase Bundle'}
          </button>
        </div>
      ))}
    </div>
  )
}
