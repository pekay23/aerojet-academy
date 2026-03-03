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
    return <div className="p-5 text-center text-[#888]">Loading...</div>
  }

  return (
    <div>
      {/* Ambassador Status Badge */}
      {info?.isAmbassador && (
        <div className="px-4 py-3 bg-linear-to-br from-amber-500/15 to-yellow-500/10 border border-amber-500/30 rounded-[10px] mb-4 flex items-center gap-3">
          <span className="text-2xl">🏅</span>
          <div>
            <div className="font-bold text-amber-300 text-sm">Ambassador</div>
            <div className="text-amber-600 text-xs">
              You receive €270/seat (lifetime discount) + €100 credit applied
            </div>
          </div>
        </div>
      )}

      {/* Referral Code */}
      <div className="p-4 bg-white/3 border border-white/8 rounded-[10px] mb-4">
        <div className="text-[13px] text-[#888] mb-2">Your Referral Code</div>
        {info?.referralCode ? (
          <div className="flex items-center gap-3">
            <code className="text-lg font-bold text-blue-300 bg-blue-500/10 px-4 py-2 rounded-lg tracking-[2px] flex-1 text-center">
              {info.referralCode}
            </code>
            <button
              onClick={copyLink}
              className={`px-4 py-2 border-none rounded-lg cursor-pointer text-xs font-semibold whitespace-nowrap transition-colors duration-150 ${
                copied
                  ? 'bg-emerald-500/20 text-emerald-500'
                  : 'bg-blue-500/20 text-blue-300'
              }`}
            >
              {copied ? '✅ Copied!' : '📋 Copy Link'}
            </button>
          </div>
        ) : (
          <button
            onClick={generateCode}
            className="px-5 py-2.5 bg-linear-to-br from-blue-500 to-blue-600 text-white border-none rounded-lg cursor-pointer font-semibold text-[13px]"
          >
            Generate Referral Code
          </button>
        )}
      </div>

      {/* Progress to Ambassador */}
      {!info?.isAmbassador && (
        <div className="p-4 bg-white/3 border border-white/8 rounded-[10px] mb-4">
          <div className="text-[13px] text-[#888] mb-2">
            Progress to Ambassador ({info?.qualifiedReferrals || 0}/10)
          </div>
          <div className="h-2 bg-white/5 rounded full overflow-hidden">
            <div
              className="h-full bg-linear-to-r from-amber-400 to-amber-300 rounded-full transition-[width] duration-500"
              style={{ width: `${info?.progressToAmbassador || 0}%` }}
            />
          </div>
          <div className="text-[11px] text-[#888] mt-1">
            {info?.remainingForAmbassador || 10} more qualified referrals needed
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: 'Total', value: info?.totalReferrals || 0, colorClass: 'text-blue-500' },
          { label: 'Qualified', value: info?.qualifiedReferrals || 0, colorClass: 'text-emerald-500' },
          { label: 'Pending', value: info?.pendingReferrals || 0, colorClass: 'text-amber-400' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="text-center p-3 bg-white/2 rounded-lg border border-white/6"
          >
            <div className={`text-[22px] font-bold ${stat.colorClass}`}>{stat.value}</div>
            <div className="text-[11px] text-[#888]">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Recent Referrals */}
      {info?.referrals && info.referrals.length > 0 && (
        <div>
          <div className="text-[13px] text-[#888] mb-2">Recent Referrals</div>
          {info.referrals.slice(0, 5).map((r) => (
            <div
              key={r.id}
              className="flex justify-between px-3 py-2 border-b border-white/4 text-xs"
            >
              <span className="text-[#e0e0e0]">{r.refereeName}</span>
              <span className={r.status === 'QUALIFIED' ? 'text-emerald-500' : 'text-amber-400'}>
                {r.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
