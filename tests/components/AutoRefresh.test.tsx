import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import AutoRefresh from '@/components/AutoRefresh'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}))

describe('AutoRefresh', () => {
  it('renders nothing', () => {
    const { container } = render(<AutoRefresh />)
    expect(container.innerHTML).toBe('')
  })

  it('accepts custom interval', () => {
    const { container } = render(<AutoRefresh intervalMs={5000} />)
    expect(container.innerHTML).toBe('')
  })
})
