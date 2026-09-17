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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchMemberships()
  }, [])

  if (isLoading) {
    return <div className="p-5 text-center text-[#888]">Loading your pools...</div>
  }

  const active = memberships.filter((m) => ['RESERVED', 'CONFIRMED'].includes(m.status))
  const past = memberships.filter((m) => ['CANCELLED', 'COMPLETED'].includes(m.status))

  if (memberships.length === 0) {
    return (
      <div className="rounded-xl border border-white/6 bg-white/2 px-5 py-10 text-center text-[#888]">
        <div className="mb-2 text-[32px]">📋</div>
        <div className="mb-1 font-semibold">No pool memberships yet</div>
        <div className="text-[13px]">Browse available pools and join one to get started.</div>
      </div>
    )
  }

  return (
    <div>
      {/* Active Memberships */}
      {active.length > 0 && (
        <div className="mb-6">
          <h3 className="mb-3 text-base font-semibold text-[#e0e0e0]">
            Active Pools ({active.length})
          </h3>
          {active.map((m) => (
            <div key={m.id} className="mb-3 rounded-[10px] border border-white/8 bg-white/3 p-4">
              <div className="mb-2 flex justify-between">
                <div>
                  <span className="text-[13px] font-medium text-[#93c5fd]">
                    {m.examComponent?.course?.code || 'Module'}
                  </span>
                  <span className="mx-2 text-[#666]">•</span>
                  <span className="text-[13px] text-[#888]">{m.examComponent?.name || 'Exam'}</span>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    m.status === 'CONFIRMED'
                      ? 'bg-[rgba(16,185,129,0.15)] text-[#10b981]'
                      : 'bg-[rgba(245,158,11,0.15)] text-[#f59e0b]'
                  }`}
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

              <div className="mt-2 flex items-center justify-between">
                <div className="text-[12px] text-[#888]">
                  📅{' '}
                  {new Date(m.pool.examDate).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                  {m.amountReserved > 0 && (
                    <span className="ml-3">💰 €{Number(m.amountReserved).toFixed(0)} reserved</span>
                  )}
                  {m.amountPaid > 0 && (
                    <span className="ml-3 text-[#10b981]">
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
          <h3 className="mb-3 text-base font-semibold text-[#888]">Past ({past.length})</h3>
          {past.map((m) => (
            <div
              key={m.id}
              className="mb-2 rounded-lg border border-white/4 bg-white/1 px-4 py-3 opacity-60"
            >
              <div className="flex justify-between">
                <span className="text-[13px] text-[#888]">
                  {m.examComponent?.course?.code} — {m.pool.name}
                </span>
                <span
                  className={`text-[11px] ${
                    m.status === 'COMPLETED' ? 'text-[#10b981]' : 'text-[#ef4444]'
                  }`}
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
