import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PoolProgressBar } from '@/components/exam-only/PoolProgressBar'

describe('PoolProgressBar', () => {
  it('renders pool name and status label', () => {
    render(
      <PoolProgressBar
        currentCount={5}
        minCandidates={4}
        maxCandidates={20}
        status="OPEN"
        poolName="Test Pool"
      />
    )
    expect(screen.getByText('Test Pool')).toBeInTheDocument()
    expect(screen.getByText('5 candidates')).toBeInTheDocument()
  })

  it('shows confirmed status', () => {
    render(
      <PoolProgressBar
        currentCount={10}
        minCandidates={4}
        maxCandidates={20}
        status="CONFIRMED"
        poolName="Confirmed Pool"
      />
    )
    expect(screen.getByText('✅ Confirmed')).toBeInTheDocument()
  })

  it('shows near-full warning color', () => {
    render(
      <PoolProgressBar
        currentCount={18}
        minCandidates={4}
        maxCandidates={20}
        status="NEAR_FULL"
        poolName="Almost Full"
      />
    )
    expect(screen.getByText('🟡 Near Full')).toBeInTheDocument()
  })

  it('shows full status', () => {
    render(
      <PoolProgressBar
        currentCount={20}
        minCandidates={4}
        maxCandidates={20}
        status="FULL"
        poolName="Full Pool"
      />
    )
    expect(screen.getByText('20/20')).toBeInTheDocument()
  })

  it('displays min/max info', () => {
    render(
      <PoolProgressBar
        currentCount={3}
        minCandidates={4}
        maxCandidates={20}
        status="OPEN"
        poolName="Pool"
      />
    )
    expect(screen.getByText('Min 4 • Max 20')).toBeInTheDocument()
  })

  it('shows meets-min label when threshold reached', () => {
    render(
      <PoolProgressBar
        currentCount={5}
        minCandidates={4}
        maxCandidates={20}
        status="OPEN"
        poolName="Pool"
      />
    )
    expect(screen.getByText('✅ Meets Min')).toBeInTheDocument()
  })
})
