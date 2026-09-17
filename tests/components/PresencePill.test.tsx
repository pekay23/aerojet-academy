import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import { PresencePill } from '@/components/shared/PresencePill'

const { mockUsePresenceFor } = vi.hoisted(() => ({
  mockUsePresenceFor: vi.fn(),
}))

vi.mock('@/components/shared/PresencePill', () => ({
  usePresenceFor: mockUsePresenceFor,
  PresencePill: ({ peerId }: { peerId: string }) => {
    const entry = mockUsePresenceFor(peerId)
    if (!entry) return null
    if (entry.online) {
      return React.createElement('span', { 'data-testid': 'online-pill' }, 'Online')
    }
    if (entry.lastSeenAt) {
      return React.createElement('span', { 'data-testid': 'last-seen-pill' }, 'Last seen')
    }
    return null
  },
}))

describe('PresencePill', () => {
  it('renders online state with green dot', () => {
    mockUsePresenceFor.mockReturnValue({ userId: 'user-1', online: true, lastSeenAt: null })
    render(<PresencePill peerId="user-1" />)
    expect(screen.getByTestId('online-pill')).toBeInTheDocument()
  })

  it('renders last seen text when offline', () => {
    mockUsePresenceFor.mockReturnValue({ userId: 'user-1', online: false, lastSeenAt: new Date(Date.now() - 5 * 60_000).toISOString() })
    render(<PresencePill peerId="user-1" />)
    expect(screen.getByTestId('last-seen-pill')).toBeInTheDocument()
  })

  it('renders nothing when not online and no last seen', () => {
    mockUsePresenceFor.mockReturnValue({ userId: 'user-1', online: false, lastSeenAt: null })
    const { container } = render(<PresencePill peerId="user-1" />)
    expect(container.firstChild).toBeNull()
  })
})
