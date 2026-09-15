import { describe, expect, it, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

vi.mock('@/app/staff/exams/internal/_components/ViolationReviewPanel', () => ({
  default: () => null,
}))
vi.mock('@/app/staff/exams/internal/_components/ConfirmModal', () => ({
  default: () => null,
}))

import ExamOperations from '@/app/staff/exams/internal/_components/ExamOperations'

function jsonResponse(data: unknown) {
  return {
    ok: true,
    json: vi.fn().mockResolvedValue({ success: true, data }),
  } as unknown as Response
}

function sessionRow(answers?: unknown[]) {
  return {
    id: 'session-1',
    student: {
      id: 'student-1',
      name: 'Avery Student',
      email: 'student@example.com',
      studentId: 'AJA-TEST-0001',
    },
    bank: {
      id: 'bank-1',
      name: 'M1 Mathematics',
      moduleCode: 'M1-MATH',
      courseCode: 'M1',
    },
    status: 'IN_PROGRESS',
    startedAt: '2026-09-12T07:00:00.000Z',
    expiresAt: '2026-09-12T09:00:00.000Z',
    submittedAt: null,
    score: null,
    totalPoints: null,
    percentage: null,
    passed: null,
    isPublished: false,
    autoSubmitted: false,
    voidedAt: null,
    voidReason: null,
    answerCount: 1,
    violationCount: 0,
    reports: [],
    ...(answers ? { answers } : {}),
  }
}

describe('ExamOperations', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('keeps loaded answer details when the slim session list refreshes', async () => {
    const listResponse = jsonResponse([sessionRow()])
    const detailResponse = jsonResponse(
      sessionRow([
        {
          id: 'answer-1',
          questionId: 'question-1',
          questionText: 'Solve the sample equation.',
          questionRef: 'M1.01',
          options: ['Option A', 'Option B', 'Option C'],
          correctAnswer: 'Option B',
          selectedAnswer: 'Option A',
          isCorrect: false,
          points: 1,
          pointsAwarded: 0,
          answeredAt: '2026-09-12T07:10:00.000Z',
        },
      ])
    )
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(listResponse)
      .mockResolvedValueOnce(detailResponse)
      .mockResolvedValueOnce(listResponse)
      .mockResolvedValue(listResponse)
    vi.stubGlobal('fetch', fetchMock)

    render(<ExamOperations />)

    await screen.findByText('Avery Student')
    fireEvent.click(screen.getByRole('button', { name: /Avery Student/ }))
    await screen.findByText('Solve the sample equation.')

    fireEvent.click(screen.getByRole('button', { name: 'Refresh' }))
    await waitFor(() => expect(fetchMock.mock.calls.length).toBeGreaterThanOrEqual(3))

    expect(screen.getByText('Solve the sample equation.')).toBeInTheDocument()
    expect(screen.getByText('Option A')).toBeInTheDocument()
  }, 15_000)
})
