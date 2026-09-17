import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CopyButton } from '@/components/shared/CopyButton'

describe('CopyButton', () => {
  it('renders Copy text initially', () => {
    render(<CopyButton value="test-value" />)
    expect(screen.getByText('Copy')).toBeInTheDocument()
  })

  it('copies text to clipboard on click', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, { clipboard: { writeText } })
    render(<CopyButton value="test-value" />)
    fireEvent.click(screen.getByText('Copy'))
    expect(writeText).toHaveBeenCalledWith('test-value')
  })

  it('shows Copied! after click', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, { clipboard: { writeText } })
    render(<CopyButton value="test-value" />)
    fireEvent.click(screen.getByText('Copy'))
    expect(screen.getByText('Copied!')).toBeInTheDocument()
  })
})
