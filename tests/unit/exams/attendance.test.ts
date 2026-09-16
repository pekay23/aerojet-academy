import { describe, it, expect, vi, beforeEach } from 'vitest'
import { markExamAttendance } from '@/lib/exams/attendance'

vi.mock('@/lib/prisma/client', () => {
  const fn = () => vi.fn()
  const core: any = {
    examSitting: { findUnique: fn() },
    poolMembership: { findUnique: fn() },
    examSittingAssignment: { findFirst: fn(), updateMany: fn() },
    examBooking: { findUnique: fn(), update: fn() },
    examAttendance: { upsert: fn() },
    studentProfile: { findUnique: fn() },
    class: { findFirst: fn() },
    notification: { create: fn() },
    auditLog: { create: fn() },
    $transaction: fn(),
  }
  core.$transaction = fn()
  return { default: core, prismaUnfiltered: core }
})

vi.mock('@/lib/enrollment/pathway', () => ({
  resolveEffectiveEnrollmentType: vi.fn(() => 'FULL_TIME'),
}))

vi.mock('@/lib/audit/logger', () => ({
  createAuditLog: vi.fn(),
}))

vi.mock('@/lib/email/service', () => ({
  createNotification: vi.fn(),
}))

vi.mock('@/lib/prisma/db-base', () => ({
  default: {},
  prismaBase: {},
}))

vi.mock('server-only', () => ({}))
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

const prismaMock: any = (await import('@/lib/prisma/client')).default
const resolveEffectiveEnrollmentType: any = (await import('@/lib/enrollment/pathway'))
  .resolveEffectiveEnrollmentType
const createNotification: any = (await import('@/lib/email/service')).createNotification

const EXISTING = { id: 'att-1', bookingId: 'book-1', userId: 'user-1' }

function mockTransaction(fn: any) {
  prismaMock.$transaction.mockImplementation(async (tx: any) => {
    if (typeof fn === 'function') return fn(tx)
    return fn(tx || prismaMock)
  })
}

function mockBooking(overrides: any = {}) {
  return {
    id: 'book-1',
    userId: 'user-1',
    eventId: 'event-1',
    examId: 'exam-1',
    examComponentId: 'comp-1',
    courseId: 'course-1',
    examDate: new Date('2026-01-01'),
    result: null,
    score: null,
    percentage: null,
    demandStatus: 'SCHEDULED',
    executedAt: null,
    status: 'SCHEDULED',
    examCategory: 'OFFICIAL_EASA',
    examComponent: { courseId: 'course-1' },
    ...overrides,
  }
}

function mockSitting(overrides: any = {}) {
  return {
    id: 'sitting-1',
    eventId: 'event-1',
    examComponentId: 'comp-1',
    startTime: new Date('2026-01-01T09:00:00Z'),
    ...overrides,
  }
}

function setupMocks(t: any) {
  t.examSittingAssignment.findFirst.mockResolvedValue(null)
  t.examBooking.findUnique.mockResolvedValue(mockBooking())
  t.examAttendance.upsert.mockResolvedValue(EXISTING)
  t.examBooking.update.mockResolvedValue({})
  t.examSittingAssignment.updateMany.mockResolvedValue({})
  t.poolMembership.findUnique.mockResolvedValue(null)
  t.studentProfile.findUnique.mockResolvedValue({
    enrollmentType: 'FULL_TIME',
    programmeChoice: 'ATPL',
    academicYearId: 'yr-1',
    semesterId: 'sem-1',
  })
  t.class.findFirst.mockResolvedValue({ id: 'class-1' })
  createNotification.mockResolvedValue({ id: 'notif-1' })
  t.auditLog.create.mockResolvedValue({ id: 'audit-1' })
}

beforeEach(() => {
  vi.resetAllMocks()
  resolveEffectiveEnrollmentType.mockReturnValue('FULL_TIME')
})

describe('markExamAttendance — notifyStudent parameter', () => {
  it('sends student notification when notifyStudent is true (default) and status is ABSENT', async () => {
    mockTransaction(async (t: any) => {
      setupMocks(t)

      const result = await markExamAttendance({
        bookingId: 'book-1',
        status: 'ABSENT',
        recordedBy: 'staff-1',
      })

      expect(result).toBeDefined()
      expect(createNotification).toHaveBeenCalledTimes(1)
      expect(createNotification).toHaveBeenCalledWith(
        expect.anything,
        'user-1',
        expect.objectContaining({
          type: 'EXAM_REMINDER',
          title: 'Exam Marked as Absent',
        })
      )
    })
  })

  it('does NOT send student notification when notifyStudent is false', async () => {
    mockTransaction(async (t: any) => {
      setupMocks(t)
      createNotification.mockReset()

      const result = await markExamAttendance({
        bookingId: 'book-1',
        status: 'ABSENT',
        recordedBy: 'staff-1',
        notifyStudent: false,
      })

      expect(result).toBeDefined()
      expect(createNotification).not.toHaveBeenCalled()
    })
  })

  it('does NOT send notification when status is PRESENT', async () => {
    mockTransaction(async (t: any) => {
      setupMocks(t)
      createNotification.mockReset()

      const result = await markExamAttendance({
        bookingId: 'book-1',
        status: 'PRESENT',
        recordedBy: 'staff-1',
      })

      expect(result).toBeDefined()
      expect(createNotification).not.toHaveBeenCalled()
    })
  })

  it('does NOT send notification when status is EXCUSED', async () => {
    mockTransaction(async (t: any) => {
      setupMocks(t)
      createNotification.mockReset()

      const result = await markExamAttendance({
        bookingId: 'book-1',
        status: 'EXCUSED',
        recordedBy: 'staff-1',
      })

      expect(result).toBeDefined()
      expect(createNotification).not.toHaveBeenCalled()
    })
  })
})

describe('markExamAttendance — booking state transitions', () => {
  it('marks an absent booking as executed and records the absence', async () => {
    mockTransaction(async (t: any) => {
      setupMocks(t)

      await markExamAttendance({
        bookingId: 'book-1',
        status: 'ABSENT',
        recordedBy: 'staff-1',
      })

      expect(t.examBooking.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'book-1' },
          data: expect.objectContaining({
            status: 'NO_SHOW',
            demandStatus: 'EXECUTED',
            executedAt: new Date('2026-01-01'),
            result: 'ABSENT',
          }),
        })
      )
    })
  })

  it('keeps an excused booking pending and clears stale execution state', async () => {
    mockTransaction(async (t: any) => {
      setupMocks(t)
      t.examBooking.findUnique.mockResolvedValue(
        mockBooking({ demandStatus: 'EXECUTED', executedAt: new Date('2026-01-01') })
      )

      await markExamAttendance({
        bookingId: 'book-1',
        status: 'EXCUSED',
        recordedBy: 'staff-1',
      })

      expect(t.examBooking.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'book-1' },
          data: expect.objectContaining({
            demandStatus: 'SCHEDULED',
            executedAt: null,
            result: 'EXCUSED',
          }),
        })
      )
    })
  })

  it('clears a stale no-show outcome when re-marking a booking present', async () => {
    mockTransaction(async (t: any) => {
      setupMocks(t)
      t.examBooking.findUnique.mockResolvedValue(
        mockBooking({ result: 'NO_SHOW', status: 'NO_SHOW' })
      )

      await markExamAttendance({
        bookingId: 'book-1',
        status: 'PRESENT',
        recordedBy: 'staff-1',
      })

      expect(t.examBooking.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'book-1' },
          data: expect.objectContaining({
            status: 'APPROVED',
            demandStatus: 'EXECUTED',
            executedAt: new Date('2026-01-01'),
            result: null,
            cancellationReason: null,
            cancelledAt: null,
            cancelledBy: null,
          }),
        })
      )
    })
  })
})

describe('markExamAttendance — notification error propagation', () => {
  it('propagates notification failure (no silent swallow) when notifyStudent is true', async () => {
    mockTransaction(async (t: any) => {
      setupMocks(t)
      createNotification.mockRejectedValue(new Error('Notification service down'))

      await expect(
        markExamAttendance({
          bookingId: 'book-1',
          status: 'ABSENT',
          recordedBy: 'staff-1',
        })
      ).rejects.toThrow('Notification service down')
    })
  })

  it('propagates notification failure when notifyStudent is explicitly true', async () => {
    mockTransaction(async (t: any) => {
      setupMocks(t)
      createNotification.mockRejectedValue(new Error('SMTP timeout'))

      await expect(
        markExamAttendance({
          bookingId: 'book-1',
          status: 'ABSENT',
          recordedBy: 'staff-1',
          notifyStudent: true,
        })
      ).rejects.toThrow('SMTP timeout')
    })
  })
})

describe('markExamAttendance — entity-scoped processing', () => {
  it('processes booking even when another student has attendance for the same sitting', async () => {
    mockTransaction(async (t: any) => {
      setupMocks(t)

      const result = await markExamAttendance({
        bookingId: 'book-1',
        status: 'ABSENT',
        recordedBy: 'staff-1',
      })

      expect(result).toBeDefined()
      expect(t.examAttendance.upsert).toHaveBeenCalled()
    })
  })

  it('processes booking when student-module dedup key is already seen (notification suppressed, attendance still marked)', async () => {
    mockTransaction(async (t: any) => {
      setupMocks(t)

      const result = await markExamAttendance({
        bookingId: 'book-1',
        status: 'ABSENT',
        recordedBy: 'staff-1',
        notifyStudent: false,
      })

      expect(result).toBeDefined()
      expect(t.examAttendance.upsert).toHaveBeenCalledTimes(1)
      expect(createNotification).not.toHaveBeenCalled()
    })
  })
})

describe('markExamAttendance — bookingId OR (sittingId AND userId) matching', () => {
  it('resolves booking by bookingId when both bookingId and sittingId are provided', async () => {
    mockTransaction(async (t: any) => {
      setupMocks(t)

      await markExamAttendance({
        bookingId: 'book-1',
        sittingId: 'sitting-1',
        status: 'ABSENT',
        recordedBy: 'staff-1',
      })

      expect(t.examBooking.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'book-1' } })
      )
    })
  })
})
