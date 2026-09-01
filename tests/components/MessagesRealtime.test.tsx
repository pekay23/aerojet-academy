import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import MessagesRealtime from '@/components/shared/MessagesRealtime'
import { useRealtimeMessages } from '@/hooks/useRealtimeMessages'

describe('MessagesRealtime', () => {
  it('renders nothing (returns null)', () => {
    const { container } = render(<MessagesRealtime userId="user-1" />)
    expect(container.firstChild).toBeNull()
  })

  it('does not crash when mounted', () => {
    expect(() => render(<MessagesRealtime userId="user-1" />)).not.toThrow()
  })

  it('calls useRealtimeMessages with userId', () => {
    render(<MessagesRealtime userId="user-123" />)
    expect(useRealtimeMessages).toHaveBeenCalledWith('user-123')
  })
})
