import { describe, it, expect, vi, afterEach } from 'vitest'
import { render } from '@testing-library/react'
import Heartbeat from '@/components/shared/Heartbeat'

describe('Heartbeat', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('renders nothing (returns null)', () => {
    const { container } = render(<Heartbeat />)
    expect(container.firstChild).toBeNull()
  })

  it('does not crash when mounted', () => {
    expect(() => render(<Heartbeat />)).not.toThrow()
  })

  it('pings heartbeat endpoint on mount', async () => {
    vi.useFakeTimers()
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({ ok: true } as any)
    render(<Heartbeat intervalMs={1000} />)
    expect(fetchSpy).toHaveBeenCalledWith('/api/me/heartbeat', { method: 'POST', keepalive: true })
  })
})
