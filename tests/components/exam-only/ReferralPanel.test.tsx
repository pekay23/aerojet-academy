import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { ReferralPanel } from '@/components/exam-only/ReferralPanel'

describe('ReferralPanel', () => {
  const originalFetch = global.fetch

  afterEach(() => {
    vi.resetAllMocks()
    global.fetch = originalFetch
  })

  it('shows loading state initially', () => {
    global.fetch = vi.fn(() => new Promise<Response>(() => {}))
    render(<ReferralPanel />)
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('renders referral code when available', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            referralCode: 'ABC123',
            isAmbassador: false,
            totalReferrals: 0,
            qualifiedReferrals: 0,
            pendingReferrals: 0,
            progressToAmbassador: 0,
            remainingForAmbassador: 10,
            referrals: [],
          }),
      } as any)
    )

    render(<ReferralPanel />)

    await waitFor(() => {
      expect(screen.getByText('ABC123')).toBeInTheDocument()
    })
  })

  it('shows generate button when no code', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            referralCode: null,
            isAmbassador: false,
            totalReferrals: 0,
            qualifiedReferrals: 0,
            pendingReferrals: 0,
            progressToAmbassador: 0,
            remainingForAmbassador: 10,
            referrals: [],
          }),
      } as any)
    )

    render(<ReferralPanel />)

    await waitFor(() => {
      expect(screen.getByText('Generate Referral Code')).toBeInTheDocument()
    })
  })

})
