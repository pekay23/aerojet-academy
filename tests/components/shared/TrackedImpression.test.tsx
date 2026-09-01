import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import TrackedImpression from '@/components/shared/TrackedImpression'

vi.mock('@/app/(portal)/_actions/analytics', () => ({
  recordCourseEngagement: vi.fn(),
}))

describe('TrackedImpression', () => {
  it('renders nothing', () => {
    const { container } = render(<TrackedImpression courseId="course-1" />)
    expect(container.innerHTML).toBe('')
  })

  it('calls tracking on mount', async () => {
    const { recordCourseEngagement } = await import('@/app/(portal)/_actions/analytics')
    render(<TrackedImpression courseId="course-1" />)
    expect(recordCourseEngagement).toHaveBeenCalledWith('course-1', 'VIEW')
  })
})
