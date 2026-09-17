import { beforeEach, describe, expect, it, vi } from 'vitest'
import { prismaMock } from '@/tests/setup'

const mocks = vi.hoisted(() => ({
  requireInstructor: vi.fn(),
  getInstructorProfile: vi.fn(),
  isExamEnabled: vi.fn(),
}))

vi.mock('@/lib/auth/helpers', () => ({
  requireInstructor: () => mocks.requireInstructor(),
}))
vi.mock('@/lib/instructor/profile', () => ({
  getInstructorProfileByUserId: mocks.getInstructorProfile,
}))
vi.mock('@/lib/internal-exam/engine', () => ({
  isInternalExamSystemEnabled: mocks.isExamEnabled,
}))

import { GET } from '@/app/api/instructor/exams/classes/[classId]/monitor/route'

function makeRequest(url: string): Request {
  return new Request(url)
}

describe('GET /api/instructor/exams/classes/[classId]/monitor', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mocks.requireInstructor.mockResolvedValue({ id: 'instructor-1' })
    mocks.getInstructorProfile.mockResolvedValue({ id: 'profile-1' })
    mocks.isExamEnabled.mockResolvedValue(true)
    prismaMock.class.findUnique.mockResolvedValue({
      id: 'class-1',
      instructorId: 'profile-1',
    })
  })

  it('returns submitted question text and answer details for expanded monitor rows', async () => {
    const answeredAt = new Date('2026-09-12T08:00:00.000Z')
    prismaMock.internalExamSession.findMany.mockResolvedValue([
      {
        id: 'session-1',
        status: 'COMPLETED',
        student: {
          id: 'student-1',
          email: 'student@example.com',
          profile: { firstName: 'Avery', lastName: 'Student' },
        },
        bank: { id: 'bank-1', name: 'M1 Mathematics' },
        answers: [
          {
            id: 'answer-1',
            selectedAnswer: 'Option B',
            pointsAwarded: 1,
            isCorrect: true,
            answeredAt,
            question: {
              id: 'question-1',
              text: 'Solve the sample equation.',
              correctAnswer: 'Option B',
              points: 1,
            },
          },
        ],
        score: 1,
        totalPoints: 1,
        percentage: 100,
        passed: true,
        startedAt: new Date('2026-09-12T07:00:00.000Z'),
        expiresAt: null,
        submittedAt: answeredAt,
      },
    ])

    const response = await GET(
      makeRequest('http://localhost/api/instructor/exams/classes/class-1/monitor') as any,
      { params: Promise.resolve({ classId: 'class-1' }) } as any
    )
    const json = await response.json()

    expect(json.success).toBe(true)
    expect(json.data[0].answers).toEqual([
      expect.objectContaining({
        question: expect.objectContaining({
          id: 'question-1',
          text: 'Solve the sample equation.',
          correctAnswer: 'Option B',
        }),
        selectedAnswer: 'Option B',
        pointsAwarded: 1,
        isCorrect: true,
        answeredAt: '2026-09-12T08:00:00.000Z',
      }),
    ])
    expect(prismaMock.internalExamSession.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { classId: 'class-1' },
        include: expect.objectContaining({
          answers: expect.objectContaining({
            include: expect.objectContaining({
              question: expect.objectContaining({
                select: expect.objectContaining({ text: true, correctAnswer: true }),
              }),
            }),
          }),
        }),
      })
    )
  })
})
