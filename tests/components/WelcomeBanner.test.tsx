import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import WelcomeBanner from '@/components/WelcomeBanner'

describe('WelcomeBanner', () => {
  it('renders without crashing', () => {
    render(<WelcomeBanner messages={['Welcome to Aerojet!']} />)
    expect(screen.getByText('Welcome to Aerojet!')).toBeInTheDocument()
  })

  it('renders user name when provided', () => {
    render(<WelcomeBanner messages={['Welcome!']} userName="John" />)
    expect(screen.getByText(/Good to see you, John/)).toBeInTheDocument()
  })

  it('renders one of the provided messages', () => {
    const messages = ['Message A', 'Message B', 'Message C']
    render(<WelcomeBanner messages={messages} />)
    const found = messages.some(msg => screen.queryByText(msg) !== null)
    expect(found).toBe(true)
  })

  it('renders sparkles icon', () => {
    const { container } = render(<WelcomeBanner messages={['Welcome']} />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })
})
