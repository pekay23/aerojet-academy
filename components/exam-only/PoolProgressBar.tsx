'use client'

import { useState } from 'react'

interface PoolProgressBarProps {
  currentCount: number
  minCandidates: number
  maxCandidates: number
  status: string
  poolName: string
}

export function PoolProgressBar({
  currentCount,
  minCandidates,
  maxCandidates,
  status,
  poolName,
}: PoolProgressBarProps) {
  const percentage = Math.round((currentCount / maxCandidates) * 100)
  const isNearFull = currentCount >= maxCandidates - 5 // Near-full threshold ~23
  const isFull = currentCount >= maxCandidates
  const meetsMin = currentCount >= minCandidates

  const getStatusColor = () => {
    if (['CONFIRMED', 'LOCKED'].includes(status)) return '#10b981' // green
    if (isFull) return '#6b7280' // gray
    if (isNearFull) return '#f59e0b' // amber
    return '#3b82f6' // blue
  }

  const getStatusLabel = () => {
    switch (status) {
      case 'CONFIRMED':
        return '✅ Confirmed'
      case 'LOCKED':
        return '🔒 Locked'
      case 'NEAR_FULL':
        return '🟡 Near Full'
      case 'FAILED':
        return '❌ Failed'
      case 'CANCELLED':
        return '⛔ Cancelled'
      default:
        return meetsMin ? '✅ Meets Min' : '🔵 Open'
    }
  }

  return (
    <div className="pool-progress" style={{ marginBottom: '12px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '4px',
        }}
      >
        <span style={{ fontWeight: 600, fontSize: '14px' }}>{poolName}</span>
        <span style={{ fontSize: '12px', color: getStatusColor(), fontWeight: 500 }}>
          {getStatusLabel()}
        </span>
      </div>

      {/* Progress bar */}
      <div
        style={{
          position: 'relative',
          height: '24px',
          backgroundColor: '#1a1a2e',
          borderRadius: '12px',
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        {/* Min threshold marker */}
        <div
          style={{
            position: 'absolute',
            left: `${(minCandidates / maxCandidates) * 100}%`,
            top: 0,
            bottom: 0,
            width: '2px',
            backgroundColor: 'rgba(16, 185, 129, 0.6)',
            zIndex: 2,
          }}
          title={`Minimum: ${minCandidates}`}
        />

        {/* Fill */}
        <div
          style={{
            width: `${percentage}%`,
            height: '100%',
            background: isFull
              ? 'linear-gradient(90deg, #6b7280, #9ca3af)'
              : isNearFull
                ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                : meetsMin
                  ? 'linear-gradient(90deg, #10b981, #34d399)'
                  : 'linear-gradient(90deg, #3b82f6, #60a5fa)',
            borderRadius: '12px',
            transition: 'width 0.5s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: '#fff',
              textShadow: '0 1px 2px rgba(0,0,0,0.5)',
            }}
          >
            {currentCount}/{maxCandidates}
          </span>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '11px',
          color: '#888',
          marginTop: '2px',
        }}
      >
        <span>{currentCount} candidates</span>
        <span>
          Min {minCandidates} • Max {maxCandidates}
        </span>
      </div>
    </div>
  )
}
