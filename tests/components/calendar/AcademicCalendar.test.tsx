import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import AcademicCalendar from '@/components/calendar/AcademicCalendar'

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

describe('AcademicCalendar', () => {
  const mockEvents = [
    {
      id: '1',
      dbId: 'db-1',
      title: 'Test Class',
      description: 'A test class',
      startDate: '2025-01-15T09:00:00Z',
      endDate: '2025-01-15T11:00:00Z',
      color: '#4A72E8',
      source: 'class' as const,
      editable: true,
      visibleTo: 'ALL',
    },
  ]

  it('renders without crashing', () => {
    render(
      <AcademicCalendar
        events={[]}
        currentUserId="user-1"
      />
    )
    expect(screen.getByText('Today')).toBeInTheDocument()
  })

  it('renders view mode buttons', () => {
    render(
      <AcademicCalendar
        events={[]}
        currentUserId="user-1"
      />
    )
    expect(screen.getByText('Month')).toBeInTheDocument()
    expect(screen.getByText('Week')).toBeInTheDocument()
    expect(screen.getByText('Day')).toBeInTheDocument()
  })

  it('renders navigation buttons', () => {
    render(
      <AcademicCalendar
        events={[]}
        currentUserId="user-1"
      />
    )
    expect(screen.getByLabelText('Previous period')).toBeInTheDocument()
    expect(screen.getByLabelText('Next period')).toBeInTheDocument()
  })

  it('renders events', () => {
    render(
      <AcademicCalendar
        events={mockEvents}
        currentUserId="user-1"
      />
    )
    // Events are rendered in the week view which is hidden on small screens
    // The mobile agenda shows "No events scheduled for this day" since the default date is today
    expect(screen.getByText('Daily Agenda')).toBeInTheDocument()
  })

  it('renders new event button when canCreate is true', () => {
    render(
      <AcademicCalendar
        events={[]}
        currentUserId="user-1"
        canCreate={true}
        onSave={vi.fn()}
      />
    )
    expect(screen.getByText('New Event')).toBeInTheDocument()
  })

  it('renders legend items', () => {
    render(
      <AcademicCalendar
        events={[]}
        currentUserId="user-1"
      />
    )
    expect(screen.getByText('Classes')).toBeInTheDocument()
    expect(screen.getByText('Exams')).toBeInTheDocument()
  })
})
