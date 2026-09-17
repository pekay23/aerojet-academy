import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import TrackedCourseLink from '@/components/shared/TrackedCourseLink'
import { recordCourseEngagement } from '@/app/(portal)/_actions/analytics'

describe('TrackedCourseLink', () => {
  it('renders link with href', () => {
    render(
      <TrackedCourseLink courseId="course-1" href="/courses/1">
        Course 1
      </TrackedCourseLink>
    )
    const link = screen.getByText('Course 1').closest('a')
    expect(link).toHaveAttribute('href', '/courses/1')
  })

  it('renders children', () => {
    render(
      <TrackedCourseLink courseId="course-1" href="/courses/1">
        Click me
      </TrackedCourseLink>
    )
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    render(
      <TrackedCourseLink courseId="course-1" href="/courses/1" className="custom-link">
        Course
      </TrackedCourseLink>
    )
    const link = screen.getByText('Course').closest('a')
    expect(link).toHaveClass('custom-link')
  })

  it('calls recordCourseEngagement on click', async () => {
    vi.mocked(recordCourseEngagement).mockClear()
    render(
      <TrackedCourseLink courseId="course-1" href="/courses/1" action="VIEW_CLICK">
        Course
      </TrackedCourseLink>
    )
    fireEvent.click(screen.getByText('Course'))
    expect(recordCourseEngagement).toHaveBeenCalledWith('course-1', 'VIEW_CLICK')
  })
})
