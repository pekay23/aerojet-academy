import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { EmptyState } from '@/components/shared/EmptyState'
import { Inbox } from 'lucide-react'

describe('EmptyState', () => {
  it('renders title', () => {
    render(<EmptyState title="No items found" />)
    expect(screen.getByText('No items found')).toBeInTheDocument()
  })

  it('renders default Inbox icon', () => {
    const { container } = render(<EmptyState title="Empty" />)
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })

  it('renders custom icon', () => {
    const CustomIcon = Inbox
    render(<EmptyState title="Empty" icon={CustomIcon} />)
    const svg = document.querySelector('svg')
    expect(svg).toBeTruthy()
  })

  it('renders description when provided', () => {
    render(<EmptyState title="Empty" description="Try adding some items" />)
    expect(screen.getByText('Try adding some items')).toBeInTheDocument()
  })

  it('renders action when provided', () => {
    render(
      <EmptyState title="Empty" action={<button>Add Item</button>} />
    )
    expect(screen.getByText('Add Item')).toBeInTheDocument()
  })
})
