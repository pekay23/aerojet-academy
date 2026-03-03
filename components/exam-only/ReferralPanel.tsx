'use client'

import { useState, useEffect } from 'react'

interface ReferralInfo {
  referralCode: string | null
  isAmbassador: boolean
  totalReferrals: number
  qualifiedReferrals: number
  pendingReferrals: number
  progressToAmbassador: number
  remainingForAmbassador: number
  referrals: Array<{
    id: string
    refereeName: string
    status: string
    createdAt: string
  }>
}

export function ReferralPanel() {
  const [info, setInfo] = useState<ReferralInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetchReferralInfo()
  }, [])

  const fetchReferralInfo = async () => {
    try {
      const res = await fetch('/api/applicant/exam-only/referrals')
      if (res.ok) {
        setInfo(await res.json())
      }
    } catch {
      console.error('Failed to load referral info')
    } finally {
      setIsLoading(false)
    }
  }

  const generateCode = async () => {
    const res = await fetch('/api/applicant/exam-only/referrals', { method: 'POST' })
    if (res.ok) {
      const data = await res.json()
      setInfo((prev) => (prev ? { ...prev, referralCode: data.referralCode } : prev))
    }
  }

  const copyLink = () => {
    if (!info?.referralCode) return
    const link = `${window.location.origin}/register?ref=${info.referralCode}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (isLoading) {
    return <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>Loading...</div>
  }

  return (
    <div>
      {/* Ambassador Status Badge */}
      {info?.isAmbassador && (
        <div
          style={{
            padding: '12px 16px',
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(234, 179, 8, 0.1))',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: '10px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <span style={{ fontSize: '24px' }}>🏅</span>
          <div>
            <div style={{ fontWeight: 700, color: '#fbbf24', fontSize: '14px' }}>Ambassador</div>
            <div style={{ color: '#d97706', fontSize: '12px' }}>
              You receive €270/seat (lifetime discount) + €100 credit applied
            </div>
          </div>
        </div>
      )}

      {/* Referral Code */}
      <div
        style={{
          padding: '16px',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '10px',
          marginBottom: '16px',
        }}
      >
        <div style={{ fontSize: '13px', color: '#888', marginBottom: '8px' }}>
          Your Referral Code
        </div>
        {info?.referralCode ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <code
              style={{
                fontSize: '18px',
                fontWeight: 700,
                color: '#93c5fd',
                background: 'rgba(59, 130, 246, 0.1)',
                padding: '8px 16px',
                borderRadius: '8px',
                letterSpacing: '2px',
                flex: 1,
                textAlign: 'center',
              }}
            >
              {info.referralCode}
            </code>
            <button
              onClick={copyLink}
              style={{
                padding: '8px 16px',
                background: copied ? 'rgba(16, 185, 129, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                color: copied ? '#10b981' : '#93c5fd',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 600,
                whiteSpace: 'nowrap',
              }}
            >
              {copied ? '✅ Copied!' : '📋 Copy Link'}
            </button>
          </div>
        ) : (
          <button
            onClick={generateCode}
            style={{
              padding: '10px 20px',
              background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '13px',
            }}
          >
            Generate Referral Code
          </button>
        )}
      </div>

      {/* Progress to Ambassador */}
      {!info?.isAmbassador && (
        <div
          style={{
            padding: '16px',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '10px',
            marginBottom: '16px',
          }}
        >
          <div style={{ fontSize: '13px', color: '#888', marginBottom: '8px' }}>
            Progress to Ambassador ({info?.qualifiedReferrals || 0}/10)
          </div>
          <div
            style={{
              height: '8px',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '4px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${info?.progressToAmbassador || 0}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #f59e0b, #fbbf24)',
                borderRadius: '4px',
                transition: 'width 0.5s',
              }}
            />
          </div>
          <div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>
            {info?.remainingForAmbassador || 10} more qualified referrals needed
          </div>
        </div>
      )}

      {/* Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '12px',
          marginBottom: '16px',
        }}
      >
        {[
          { label: 'Total', value: info?.totalReferrals || 0, color: '#3b82f6' },
          { label: 'Qualified', value: info?.qualifiedReferrals || 0, color: '#10b981' },
          { label: 'Pending', value: info?.pendingReferrals || 0, color: '#f59e0b' },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              textAlign: 'center',
              padding: '12px',
              background: 'rgba(255,255,255,0.02)',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div style={{ fontSize: '22px', fontWeight: 700, color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: '11px', color: '#888' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Recent Referrals */}
      {info?.referrals && info.referrals.length > 0 && (
        <div>
          <div style={{ fontSize: '13px', color: '#888', marginBottom: '8px' }}>
            Recent Referrals
          </div>
          {info.referrals.slice(0, 5).map((r) => (
            <div
              key={r.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
                fontSize: '12px',
              }}
            >
              <span style={{ color: '#e0e0e0' }}>{r.refereeName}</span>
              <span style={{ color: r.status === 'QUALIFIED' ? '#10b981' : '#f59e0b' }}>
                {r.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
