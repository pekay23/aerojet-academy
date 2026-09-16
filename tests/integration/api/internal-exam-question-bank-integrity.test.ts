import { beforeEach, describe, expect, it, vi } from 'vitest'
import { prismaMock } from '@/tests/setup'

const mocks = vi.hoisted(() => ({
  getAuthSession: vi.fn(),
  requireInstructor: vi.fn(),
  requireStaff: vi.fn(),
  getInstructorProfile: vi.fn(),
  isExamEnabled: vi.fn(),
}))

vi.mock('@/lib/auth/helpers', () => ({
  getAuthSession: mocks.getAuthSession,
  requireInstructor: mocks.requireInstructor,
  requireStaff: mocks.requireStaff,
}))
vi.mock('@/lib/instructor/profile', () => ({
  getInstructorProfileByUserId: mocks.getInstructorProfile,
}))
vi.mock('@/lib/internal-exam/engine', () => ({
  isInternalExamSystemEnabled: mocks.isExamEnabled,
}))

import {
  GET as staffQuestionsGet,
  POST as staffQuestionsPost,
  PATCH as staffQuestionsPatch,
} from '@/app/api/staff/exams/internal/banks/[bankId]/questions/route'
import { POST as retireBankPost } from '@/app/api/staff/exams/internal/banks/[bankId]/retire/route'
import {
  GET as instructorQuestionsGet,
  POST as instructorQuestionsPost,
} from '@/app/api/instructor/exams/banks/[bankId]/questions/route'

function makeRequest(url: string, body?: unknown, method = 'GET'): any {
  return new Request(url, {
    method,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  }) as any
}

function makeContext(bankId = 'bank-1') {
  return { params: Promise.resolve({ bankId }) } as any
}

async function readJson(response: Response) {
  return response.json() as Promise<any>
}

const validQuestion = (text: string, options = ['A', 'B', 'C'], correctAnswer = 'A') => ({
  text,
  options,
  correctAnswer,
  subTopic: 'Electrical',
  difficulty: 'EASY',
  points: 1,
  syllabusRef: '3.1.1',
  explanation: 'Explanation',
})

describe('internal exam question bank integrity routes', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mocks.getAuthSession.mockResolvedValue({ user: { id: 'staff-1', role: 'STAFF' } })
    mocks.requireInstructor.mockResolvedValue({ id: 'instructor-1' })
    mocks.requireStaff.mockResolvedValue({ id: 'staff-1' })
    mocks.getInstructorProfile.mockResolvedValue({ id: 'profile-1' })
    mocks.isExamEnabled.mockResolvedValue(true)

    prismaMock.$transaction.mockImplementation(async (callback: any) => {
      if (typeof callback === 'function') return callback(prismaMock)
      return callback
    })
    prismaMock.internalExamBank.findUnique.mockResolvedValue({
      id: 'bank-1',
      name: 'Electrical Fundamentals',
      isActive: true,
    })
    prismaMock.internalExamBank.update.mockResolvedValue({
      id: 'bank-1',
      name: 'Electrical Fundamentals',
      isActive: false,
    })
    prismaMock.internalExamBankInstructor.findFirst.mockResolvedValue({
      canEdit: true,
      canMonitor: true,
      canReview: true,
    })
    prismaMock.internalExamQuestion.findMany.mockResolvedValue([])
    prismaMock.internalExamQuestion.findFirst.mockResolvedValue(null)
    prismaMock.internalExamQuestion.count.mockResolvedValue(0)
    prismaMock.internalExamQuestion.create.mockResolvedValue({ id: 'question-1' })
    prismaMock.internalExamQuestion.update.mockResolvedValue({ id: 'question-1', sortOrder: 1 })
    prismaMock.internalExamSession.count.mockResolvedValue(0)
    prismaMock.internalExamClassSchedule.count.mockResolvedValue(0)
    prismaMock.user.findMany.mockResolvedValue([])
    prismaMock.auditLog.findFirst.mockResolvedValue(null)
    prismaMock.auditLog.create.mockResolvedValue({ id: 'audit-1' })
  })

  it('rejects whitespace-only fields and duplicate options before writing', async () => {
    const response = await staffQuestionsPost(
      makeRequest(
        'http://localhost/api/staff/exams/internal/banks/bank-1/questions',
        { text: '   ', options: [' A ', ' A ', 'C'], correctAnswer: ' A ' },
        'POST'
      ),
      makeContext()
    )

    expect(response.status).toBe(400)
    expect(await readJson(response)).toEqual(
      expect.objectContaining({
        success: false,
        error: 'Invalid question data',
      })
    )
    expect(prismaMock.internalExamQuestion.findMany).not.toHaveBeenCalled()
  })

  it('rejects duplicate stems inside a batch without starting a transaction', async () => {
    prismaMock.internalExamQuestion.findMany.mockResolvedValue([])

    const response = await staffQuestionsPost(
      makeRequest(
        'http://localhost/api/staff/exams/internal/banks/bank-1/questions',
        [validQuestion('Same stem?'), validQuestion('Same stem?')],
        'POST'
      ),
      makeContext()
    )

    expect(response.status).toBe(409)
    expect((await readJson(response)).errors).toEqual([
      expect.objectContaining({
        row: 2,
        message: expect.stringContaining('Duplicate question stem'),
      }),
    ])
    expect(prismaMock.$transaction).not.toHaveBeenCalled()
  })

  it('rejects stems that already exist in the bank', async () => {
    prismaMock.internalExamQuestion.findMany.mockResolvedValue([
      { id: 'existing-question', text: 'Existing stem?' },
    ])

    const response = await staffQuestionsPost(
      makeRequest(
        'http://localhost/api/staff/exams/internal/banks/bank-1/questions',
        validQuestion('  Existing   stem? '),
        'POST'
      ),
      makeContext()
    )

    expect(response.status).toBe(409)
    expect((await readJson(response)).errors[0]).toEqual(
      expect.objectContaining({ row: 1, message: 'Question stem already exists in this bank' })
    )
  })

  it('creates a validated batch in one transaction with deterministic sort orders', async () => {
    prismaMock.internalExamQuestion.findMany.mockResolvedValue([])
    prismaMock.internalExamQuestion.findFirst.mockResolvedValue({ sortOrder: 7 })
    prismaMock.internalExamQuestion.create
      .mockResolvedValueOnce({ id: 'question-1' })
      .mockResolvedValueOnce({ id: 'question-2' })

    const response = await staffQuestionsPost(
      makeRequest(
        'http://localhost/api/staff/exams/internal/banks/bank-1/questions',
        [validQuestion('First?'), validQuestion('Second?')],
        'POST'
      ),
      makeContext()
    )

    expect(response.status).toBe(201)
    expect(await readJson(response)).toEqual(
      expect.objectContaining({
        data: expect.objectContaining({ count: 2, errors: [] }),
      })
    )
    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1)
    expect(prismaMock.internalExamQuestion.create).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ data: expect.objectContaining({ sortOrder: 8 }) })
    )
    expect(prismaMock.internalExamQuestion.create).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ data: expect.objectContaining({ sortOrder: 9 }) })
    )
  })

  it('does not commit a batch when a transaction write fails', async () => {
    prismaMock.internalExamQuestion.findMany.mockResolvedValue([])
    const transactionCreate = vi
      .fn()
      .mockResolvedValueOnce({ id: 'question-1' })
      .mockRejectedValueOnce(new Error('rollback'))
    prismaMock.$transaction.mockImplementationOnce(async (callback: any) =>
      callback({ internalExamQuestion: { create: transactionCreate } })
    )

    const response = await staffQuestionsPost(
      makeRequest(
        'http://localhost/api/staff/exams/internal/banks/bank-1/questions',
        [validQuestion('First?'), validQuestion('Second?')],
        'POST'
      ),
      makeContext()
    )

    expect(response.status).toBe(500)
    expect(transactionCreate).toHaveBeenCalledTimes(2)
    expect(prismaMock.internalExamQuestion.create).not.toHaveBeenCalled()
    expect(prismaMock.auditLog.create).not.toHaveBeenCalled()
  })

  it('paginates the staff question list and returns pagination metadata', async () => {
    prismaMock.internalExamQuestion.findMany.mockResolvedValue([
      { id: 'question-3', text: 'Third', correctAnswer: 'A', options: ['A', 'B', 'C'] },
      { id: 'question-4', text: 'Fourth', correctAnswer: 'A', options: ['A', 'B', 'C'] },
    ])
    prismaMock.internalExamQuestion.count.mockResolvedValue(5)

    const response = await staffQuestionsGet(
      makeRequest(
        'http://localhost/api/staff/exams/internal/banks/bank-1/questions?page=2&limit=2'
      ),
      makeContext()
    )

    expect(response.status).toBe(200)
    expect((await readJson(response)).meta).toEqual({ page: 2, limit: 2, total: 5, totalPages: 3 })
    expect(prismaMock.internalExamQuestion.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 2, take: 2 })
    )
  })

  it('paginates the instructor question list with the same response shape', async () => {
    prismaMock.internalExamQuestion.findMany.mockResolvedValue([
      {
        id: 'question-1',
        text: 'First',
        correctAnswer: 'A',
        options: ['A', 'B', 'C'],
        status: 'APPROVED',
        submittedById: null,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      },
    ])
    prismaMock.internalExamQuestion.count.mockResolvedValue(1)

    const response = await instructorQuestionsGet(
      makeRequest('http://localhost/api/instructor/exams/banks/bank-1/questions?page=1&limit=1'),
      makeContext()
    )

    expect(response.status).toBe(200)
    expect((await readJson(response)).meta).toEqual({ page: 1, limit: 1, total: 1, totalPages: 1 })
    expect(prismaMock.internalExamQuestion.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0, take: 1 })
    )
  })

  it('applies trimmed validation parity to instructor imports', async () => {
    const response = await instructorQuestionsPost(
      makeRequest(
        'http://localhost/api/instructor/exams/banks/bank-1/questions',
        validQuestion('Question?', ['Same', 'Same', 'C'], 'Same'),
        'POST'
      ),
      makeContext()
    )

    expect(response.status).toBe(400)
    expect((await readJson(response)).errors[0].message).toContain('Options must be unique')
  })

  it('preserves the single-question instructor response while validating and transacting', async () => {
    prismaMock.internalExamQuestion.findMany.mockResolvedValue([])
    prismaMock.internalExamQuestion.create.mockResolvedValue({ id: 'question-1' })

    const response = await instructorQuestionsPost(
      makeRequest(
        'http://localhost/api/instructor/exams/banks/bank-1/questions',
        validQuestion('Instructor question?'),
        'POST'
      ),
      makeContext()
    )

    expect(response.status).toBe(201)
    expect((await readJson(response)).data).toEqual({ id: 'question-1' })
    expect(prismaMock.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: 'EXAM_QUESTION_CREATED' }),
      })
    )
  })

  it('reorders active questions safely within their bank', async () => {
    prismaMock.internalExamQuestion.findMany.mockResolvedValue([
      { id: 'question-1', sortOrder: 1, createdAt: new Date('2026-01-01T00:00:00.000Z') },
      { id: 'question-2', sortOrder: 2, createdAt: new Date('2026-01-02T00:00:00.000Z') },
      { id: 'question-3', sortOrder: 3, createdAt: new Date('2026-01-03T00:00:00.000Z') },
    ])

    const response = await staffQuestionsPatch(
      makeRequest(
        'http://localhost/api/staff/exams/internal/banks/bank-1/questions',
        { questionId: 'question-1', direction: 'down' },
        'PATCH'
      ),
      makeContext()
    )

    expect(response.status).toBe(200)
    expect((await readJson(response)).data.questionIds).toEqual([
      'question-2',
      'question-1',
      'question-3',
    ])
    expect(prismaMock.internalExamQuestion.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { sortOrder: 1 } })
    )
  })

  it.each([
    ['active sessions', { activeSessionCount: 1, futureScheduleCount: 0, pendingQuestionCount: 0 }],
    [
      'future schedules',
      { activeSessionCount: 0, futureScheduleCount: 1, pendingQuestionCount: 0 },
    ],
    [
      'pending questions',
      { activeSessionCount: 0, futureScheduleCount: 0, pendingQuestionCount: 1 },
    ],
  ])('blocks retirement with %s', async (_label, blockers) => {
    prismaMock.internalExamSession.count.mockResolvedValue(blockers.activeSessionCount)
    prismaMock.internalExamClassSchedule.count.mockResolvedValue(blockers.futureScheduleCount)
    prismaMock.internalExamQuestion.count.mockResolvedValue(blockers.pendingQuestionCount)

    const response = await retireBankPost(
      makeRequest(
        'http://localhost/api/staff/exams/internal/banks/bank-1/retire',
        undefined,
        'POST'
      ),
      makeContext()
    )

    expect(response.status).toBe(409)
    expect((await readJson(response)).blockers).toEqual(blockers)
    expect(prismaMock.internalExamBank.update).not.toHaveBeenCalled()
  })

  it('retires a bank when no active work or pending questions exist', async () => {
    const response = await retireBankPost(
      makeRequest(
        'http://localhost/api/staff/exams/internal/banks/bank-1/retire',
        undefined,
        'POST'
      ),
      makeContext()
    )

    expect(response.status).toBe(200)
    expect(await readJson(response)).toEqual(
      expect.objectContaining({
        data: expect.objectContaining({ id: 'bank-1', isActive: false }),
      })
    )
    expect(prismaMock.internalExamBank.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { isActive: false } })
    )
  })
})
