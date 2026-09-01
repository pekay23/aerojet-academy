import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MyPoolsDashboard } from '@/components/exam-only/MyPoolsDashboard'

describe('MyPoolsDashboard', () => {
  const originalFetch = global.fetch

  afterEach(() => {
    vi.resetAllMocks()
    global.fetch = originalFetch
  })

  it('shows loading state initially', () => {
    global.fetch = vi.fn(() => new Promise(() => {}))
    render(<MyPoolsDashboard />)
    expect(screen.getByText('Loading your pools...')).toBeInTheDocument()
  })

  it('shows empty state when no memberships', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ memberships: [] }),
      } as any)
    )

    render(<MyPoolsDashboard />)

    await waitFor(() => {
      expect(screen.getByText('No pool memberships yet')).toBeInTheDocument()
    })
  })

  it('renders active and past memberships', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            memberships: [
              {
                id: '1',
                status: 'RESERVED',
                amountReserved: 100,
                amountPaid: 0,
                pool: {
                  id: 'p1',
                  name: 'Pool A',
                  examDate: '2025-01-15',
                  examStartTime: '09:00',
                  examEndTime: '11:00',
                  status: 'OPEN',
                  currentMemberCount: 5,
                  minCandidates: 4,
                  maxCandidates: 20,
                },
                examComponent: { course: { code: 'ATPL' }, name: 'Principles' },
              },
              {
                id: '2',
                status: 'COMPLETED',
                amountReserved: 0,
                amountPaid: 150,
                pool: {
                  id: 'p2',
                  name: 'Pool B',
                  examDate: '2024-12-01',
                  examStartTime: '10:00',
                  examEndTime: '12:00',
                  status: 'COMPLETED',
                  currentMemberCount: 10,
                  minCandidates: 4,
                  maxCandidates: 20,
                },
                examComponent: { course: { code: 'ATPL' }, name: 'Navigation' },
              },
            ],
          }),
      } as any)
    )

    render(<MyPoolsDashboard />)

    await waitFor(() => {
      expect(screen.getByText('Pool A')).toBeInTheDocument()
    })
    expect(screen.getByText(/Pool B/)).toBeInTheDocument()
  })

})
