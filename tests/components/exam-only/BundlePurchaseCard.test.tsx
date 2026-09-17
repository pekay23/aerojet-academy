import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { BundlePurchaseCard } from '@/components/exam-only/BundlePurchaseCard'

describe('BundlePurchaseCard', () => {
  const originalFetch = global.fetch

  afterEach(() => {
    vi.resetAllMocks()
    global.fetch = originalFetch
  })

  it('shows loading state initially', () => {
    global.fetch = vi.fn(() => new Promise<Response>(() => {}))
    render(<BundlePurchaseCard />)
    expect(screen.getByText('Loading bundles...')).toBeInTheDocument()
  })

  it('renders bundle cards after loading', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            bundles: {
              twoSeat: { price: 180, seats: 2, perSeat: 90, savings: 20 },
              fourSeat: { price: 320, seats: 4, perSeat: 80, savings: 100 },
            },
          }),
      } as any)
    )

    render(<BundlePurchaseCard />)

    await waitFor(() => {
      expect(screen.getByText('2-Seat Bundle')).toBeInTheDocument()
    })
    expect(screen.getByText('4-Seat Bundle')).toBeInTheDocument()
    expect(screen.getByText('€180')).toBeInTheDocument()
    expect(screen.getByText('€320')).toBeInTheDocument()
  })

  it('shows purchase button for each bundle', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            bundles: {
              twoSeat: { price: 180, seats: 2, perSeat: 90, savings: 20 },
              fourSeat: { price: 320, seats: 4, perSeat: 80, savings: 100 },
            },
          }),
      } as any)
    )

    render(<BundlePurchaseCard />)

    await waitFor(() => {
      expect(screen.getAllByText('Purchase Bundle')).toHaveLength(2)
    })
  })

})
