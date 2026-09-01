import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CurrencyDisplay, CurrencyToggle } from '@/components/shared/CurrencyDisplay'

describe('CurrencyDisplay', () => {
  it('renders formatted amount in base currency', () => {
    render(<CurrencyDisplay amount={1000} baseCurrency="EUR" />)
    expect(screen.getByText('€1,000.00')).toBeInTheDocument()
  })

  it('renders with custom size', () => {
    const { container } = render(<CurrencyDisplay amount={100} size="lg" />)
    const amount = container.querySelector('.text-2xl')
    expect(amount).toBeTruthy()
  })

  it('renders currency toggle when showToggle is true', () => {
    render(<CurrencyDisplay amount={100} showToggle />)
    expect(screen.getByText((content, element) => {
      return element?.tagName === 'BUTTON' && content.includes('EUR')
    })).toBeInTheDocument()
    expect(screen.getByText((content, element) => {
      return element?.tagName === 'BUTTON' && content.includes('GHS')
    })).toBeInTheDocument()
    expect(screen.getByText((content, element) => {
      return element?.tagName === 'BUTTON' && content.includes('USD')
    })).toBeInTheDocument()
  })

  it('calls onCurrencyChange when toggle is clicked', () => {
    const onCurrencyChange = vi.fn()
    render(<CurrencyDisplay amount={100} showToggle onCurrencyChange={onCurrencyChange} />)
    const usdButton = screen.getByText((content, element) => {
      return element?.tagName === 'BUTTON' && content.includes('USD')
    })
    fireEvent.click(usdButton)
    expect(onCurrencyChange).toHaveBeenCalledWith('USD')
  })
})

describe('CurrencyToggle', () => {
  it('renders currency buttons', () => {
    render(<CurrencyToggle value="EUR" onChange={vi.fn()} />)
    expect(screen.getByText((content, element) => {
      return element?.tagName === 'BUTTON' && content.includes('EUR')
    })).toBeInTheDocument()
  })

  it('calls onChange when a currency is clicked', () => {
    const onChange = vi.fn()
    render(<CurrencyToggle value="EUR" onChange={onChange} currencies={['EUR', 'USD']} />)
    const usdButton = screen.getByText((content, element) => {
      return element?.tagName === 'BUTTON' && content.includes('USD')
    })
    fireEvent.click(usdButton)
    expect(onChange).toHaveBeenCalledWith('USD')
  })
})
