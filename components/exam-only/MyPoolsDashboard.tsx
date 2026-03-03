'use client'

import { useState, useEffect } from 'react'
import { PoolProgressBar } from './PoolProgressBar'
import { WithdrawButton } from './WithdrawButton'

interface PoolMembership {
  id: string
  status: string
  amountReserved: number
  amountPaid: number
  pool: {
    id: string
    name: string
    examDate: string
    examStartTime: string
    examEndTime: string
    status: string
    currentMemberCount: number
    minCandidates: number
    maxCandidates: number
  }
  examComponent?: {
    course?: { code: string }
    name?: string
  }
}

export function MyPoolsDashboard() {
  const [memberships, setMemberships] = useState<PoolMembership[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchMemberships = async () => {
    try {
      const res = await fetch('/api/applicant/exam-only/memberships')
      const data = await res.json()
      setMemberships(data.memberships || [])
    } catch {
      console.error('Failed to load memberships')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchMemberships()
  }, [])

  if (isLoading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
        Loading your pools...
      </div>
    )
  }

  const active = memberships.filter((m) => ['RESERVED', 'CONFIRMED'].includes(m.status))
  const past = memberships.filter((m) => ['CANCELLED', 'COMPLETED'].includes(m.status))

  if (memberships.length === 0) {
    return (
      <div
        style={{
          padding: '40px 20px',
          textAlign: 'center',
          color: '#888',
          background: 'rgba(255,255,255,0.02)',
          borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div style={{ fontSize: '32px', marginBottom: '8px' }}>📋</div>
        <div style={{ fontWeight: 600, marginBottom: '4px' }}>No pool memberships yet</div>
        <div style={{ fontSize: '13px' }}>Browse available pools and join one to get started.</div>
      </div>
    )
  }

  return (
    <div>
      {/* Active Memberships */}
      {active.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px', color: '#e0e0e0' }}>
            Active Pools ({active.length})
          </h3>
          {active.map((m) => (
            <div
              key={m.id}
              style={{
                padding: '16px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '10px',
                marginBottom: '12px',
              }}
            >
              <div
                style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}
              >
                <div>
                  <span style={{ fontSize: '13px', color: '#93c5fd', fontWeight: 500 }}>
                    {m.examComponent?.course?.code || 'Module'}
                  </span>
                  <span style={{ color: '#666', margin: '0 8px' }}>•</span>
                  <span style={{ fontSize: '13px', color: '#888' }}>
                    {m.examComponent?.name || 'Exam'}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: '11px',
                    padding: '2px 8px',
                    borderRadius: '999px',
                    fontWeight: 600,
                    background:
                      m.status === 'CONFIRMED'
                        ? 'rgba(16, 185, 129, 0.15)'
                        : 'rgba(245, 158, 11, 0.15)',
                    color: m.status === 'CONFIRMED' ? '#10b981' : '#f59e0b',
                  }}
                >
                  {m.status}
                </span>
              </div>

              <PoolProgressBar
                currentCount={m.pool.currentMemberCount}
                minCandidates={m.pool.minCandidates}
                maxCandidates={m.pool.maxCandidates}
                status={m.pool.status}
                poolName={m.pool.name}
              />

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '8px',
                }}
              >
                <div style={{ fontSize: '12px', color: '#888' }}>
                  📅{' '}
                  {new Date(m.pool.examDate).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                  {m.amountReserved > 0 && (
                    <span style={{ marginLeft: '12px' }}>
                      💰 €{Number(m.amountReserved).toFixed(0)} reserved
                    </span>
                  )}
                  {m.amountPaid > 0 && (
                    <span style={{ marginLeft: '12px', color: '#10b981' }}>
                      ✅ €{Number(m.amountPaid).toFixed(0)} paid
                    </span>
                  )}
                </div>

                {m.status === 'RESERVED' && (
                  <WithdrawButton
                    poolId={m.pool.id}
                    poolName={m.pool.name}
                    amountReserved={Number(m.amountReserved)}
                    onSuccess={fetchMemberships}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Past Memberships */}
      {past.length > 0 && (
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px', color: '#888' }}>
            Past ({past.length})
          </h3>
          {past.map((m) => (
            <div
              key={m.id}
              style={{
                padding: '12px 16px',
                background: 'rgba(255,255,255,0.01)',
                border: '1px solid rgba(255,255,255,0.04)',
                borderRadius: '8px',
                marginBottom: '8px',
                opacity: 0.6,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', color: '#888' }}>
                  {m.examComponent?.course?.code} — {m.pool.name}
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    color: m.status === 'COMPLETED' ? '#10b981' : '#ef4444',
                  }}
                >
                  {m.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
