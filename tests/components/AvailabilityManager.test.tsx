import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import AvailabilityManager from '@/components/shared/AvailabilityManager'

describe('AvailabilityManager', () => {
  const slots = [
    {
      id: '1',
      kind: 'RECURRING_WEEKLY',
      dayOfWeek: 1,
      date: null,
      startTime: '09:00',
      endTime: '17:00',
      available: true,
      notes: 'Weekly',
    },
  ]

  it('renders add form', () => {
    render(<AvailabilityManager slots={slots} />)
    expect(screen.getByText('Add')).toBeInTheDocument()
  })

  it('renders existing slots', () => {
    render(<AvailabilityManager slots={slots} />)
    expect(screen.getByText('Every Monday')).toBeInTheDocument()
    expect(screen.getByText('09:00 – 17:00')).toBeInTheDocument()
  })

  it('renders empty state when no slots', () => {
    render(<AvailabilityManager slots={[]} />)
    expect(screen.getByText('No availability set.')).toBeInTheDocument()
  })

  it('shows Available badge for available slot', () => {
    render(<AvailabilityManager slots={slots} />)
    const badges = screen.getAllByText('Available')
    expect(badges.length).toBeGreaterThanOrEqual(1)
  })

  it('renders day selector for recurring weekly', () => {
    render(<AvailabilityManager slots={[]} />)
    expect(screen.getByDisplayValue('Monday')).toBeInTheDocument()
  })

  it('renders date input for specific date kind', () => {
    const specificDateSlots = [
      {
        id: '1',
        kind: 'SPECIFIC_DATE',
        dayOfWeek: null,
        date: '2024-12-25',
        startTime: '09:00',
        endTime: '17:00',
        available: true,
        notes: 'Christmas',
      },
    ]
    render(<AvailabilityManager slots={specificDateSlots} />)
    expect(screen.getByText('25/12/2024')).toBeInTheDocument()
  })
})
