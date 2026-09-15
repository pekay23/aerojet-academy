import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'

vi.mock('@/hooks/useExamMonitor', () => ({
  useExamMonitor: vi.fn(),
}))
vi.mock('@/lib/hooks/useSort', () => ({
  useSort: (items: unknown[]) => ({
    items,
    requestSort: vi.fn(),
    sortConfig: { key: 'student.name', order: 'asc' },
  }),
  SortHeader: ({ label, className }: { label: string; className?: string }) => (
    <th className={className}>{label}</th>
  ),
}))
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}))
vi.mock('@/components/shared/ConfirmDialog', () => ({
  ConfirmDialog: () => null,
}))

import ClassMonitorPage from '@/app/instructor/exams/classes/[classId]/monitor/_components/ClassMonitorPage'
import { useExamMonitor } from '@/hooks/useExamMonitor'

describe('ClassMonitorPage', () => {
  it('preserves a loaded empty answer state when a refresh omits answers', async () => {
    let refreshMonitor: (() => void) | undefined
    vi.mocked(useExamMonitor).mockImplementation((_classId, refresh) => {
      refreshMonitor = refresh
    })
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          success: true,
          data: [
            {
              id: 'session-1',
              status: 'COMPLETED',
              student: { id: 'student-1', name: 'Avery Student', email: 'student@example.com' },
              bank: { id: 'bank-1', name: 'M1 Mathematics' },
              startedAt: '2026-09-12T07:00:00.000Z',
              expiresAt: null,
              submittedAt: '2026-09-12T08:00:00.000Z',
              score: 0,
              totalPoints: 1,
              percentage: 0,
              passed: false,
              correctCount: 0,
              timeRemaining: null,
              answerCount: 0,
            },
          ],
        }),
      })
    )

    render(
      <ClassMonitorPage
        classId="class-1"
        initialClass={{
          id: 'class-1',
          name: 'M1 - 2025 - S1',
          courseName: 'Mathematics',
          courseCode: 'M1',
          enrolledCount: 20,
          startDate: '2025-09-01T00:00:00.000Z',
          endDate: '2026-01-30T00:00:00.000Z',
        }}
        initialSessions={[
          {
            id: 'session-1',
            status: 'COMPLETED',
            student: { id: 'student-1', name: 'Avery Student', email: 'student@example.com' },
            bank: { id: 'bank-1', name: 'M1 Mathematics' },
            startedAt: '2026-09-12T07:00:00.000Z',
            expiresAt: null,
            submittedAt: '2026-09-12T08:00:00.000Z',
            score: 0,
            totalPoints: 1,
            percentage: 0,
            passed: false,
            correctCount: 0,
            timeRemaining: null,
            answerCount: 0,
            answers: [],
          },
        ]}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /more/i }))
    expect(screen.getByText('No answers were recorded for this session.')).toBeInTheDocument()

    await refreshMonitor?.()

    expect(screen.getByText('No answers were recorded for this session.')).toBeInTheDocument()
    vi.unstubAllGlobals()
  }, 15_000)
  it('renders submitted question text and answers in an expanded session row', () => {
    render(
      <ClassMonitorPage
        classId="class-1"
        initialClass={{
          id: 'class-1',
          name: 'M1 - 2025 - S1',
          courseName: 'Mathematics',
          courseCode: 'M1',
          enrolledCount: 20,
          startDate: '2025-09-01T00:00:00.000Z',
          endDate: '2026-01-30T00:00:00.000Z',
        }}
        initialSessions={[
          {
            id: 'session-1',
            status: 'COMPLETED',
            student: { id: 'student-1', name: 'Avery Student', email: 'student@example.com' },
            bank: { id: 'bank-1', name: 'M1 Mathematics' },
            startedAt: '2026-09-12T07:00:00.000Z',
            expiresAt: null,
            submittedAt: '2026-09-12T08:00:00.000Z',
            score: 0,
            totalPoints: 1,
            percentage: 0,
            passed: false,
            correctCount: 0,
            timeRemaining: null,
            answerCount: 1,
            answers: [
              {
                question: {
                  id: 'question-1',
                  text: 'Solve the sample equation.',
                  correctAnswer: 'Option B',
                  points: 1,
                },
                selectedAnswer: 'Option A',
                pointsAwarded: 0,
                isCorrect: false,
                answeredAt: '2026-09-12T08:00:00.000Z',
              },
            ],
          },
        ]}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /more/i }))

    expect(screen.getByText('Solve the sample equation.')).toBeInTheDocument()
    expect(screen.getByText('Your answer')).toBeInTheDocument()
    expect(screen.getByText('Option A')).toBeInTheDocument()
    expect(screen.getByText('Correct answer')).toBeInTheDocument()
    expect(screen.getByText('Points')).toBeInTheDocument()
    expect(screen.getByText('Incorrect')).toBeInTheDocument()
  }, 15_000)
})
