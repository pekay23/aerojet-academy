/**
 * Test factory utilities for creating consistent mock data across tests.
 *
 * Usage:
 *   import { createMockUser, createMockExamPool, createMockPayment } from '@/tests/factories'
 *   const user = createMockUser({ role: 'STUDENT' })
 *   const pool = createMockExamPool({ status: 'OPEN' })
 */

import { mockAdmin, mockStudent, mockApplicant, mockInstructor } from './fixtures/users'
import { mockPool, mockNearFullPool, mockConfirmedPool, mockMembership } from './fixtures/pools'
import {
  mockWallet,
  mockTopUpTransaction,
  mockReserveTransaction,
  mockPayment,
} from './fixtures/transactions'

// ---------------------------------------------------------------------------
// Withdrawal Requests
// ---------------------------------------------------------------------------

export function createMockWithdrawalRequest(overrides: Record<string, unknown> = {}) {
  return {
    id: 'withdrawal-1',
    reason: 'Personal reasons',
    status: 'REQUESTED' as const,
    createdAt: new Date('2026-01-15').toISOString(),
    rejectedReason: null,
    user: {
      email: 'student1@test.com',
      profile: { firstName: 'Student', lastName: 'One' },
      studentProfile: { studentId: 'AJA-2026-0001' },
    },
    ...overrides,
  }
}

export function createMockWithdrawalRequests(
  count: number,
  overrides: Record<string, unknown> = {}
) {
  return Array.from({ length: count }, (_, i) =>
    createMockWithdrawalRequest({
      id: `withdrawal-${i + 1}`,
      ...overrides,
    })
  )
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export function createMockUser(overrides: Record<string, unknown> = {}) {
  const baseMap: Record<string, Record<string, unknown>> = {
    SUPER_ADMIN: mockAdmin,
    ADMIN: { ...mockAdmin, id: 'admin-2', email: 'admin2@aerojet-academy.com' },
    STAFF: { ...mockAdmin, id: 'staff-1', role: 'STAFF' },
    STUDENT: mockStudent,
    APPLICANT: mockApplicant,
    INSTRUCTOR: mockInstructor,
    EXAMINER: { ...mockInstructor, id: 'examiner-1', role: 'EXAMINER' },
  }

  const role = overrides.role as string | undefined
  const base = role ? (baseMap[role] ?? mockStudent) : mockStudent

  return {
    ...base,
    ...overrides,
    id: overrides.id ?? base.id,
  }
}

export function createMockStudentProfile(overrides: Record<string, unknown> = {}) {
  return {
    userId: 'student-1',
    enrollmentType: 'MODULAR',
    studentId: 'AJA-2026-0001',
    status: 'ACTIVE',
    programmeChoice: null,
    ...overrides,
  }
}

export function createMockInstructorProfile(overrides: Record<string, unknown> = {}) {
  return {
    userId: 'instructor-1',
    licenseNumber: 'INST-001',
    status: 'ACTIVE',
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Exams & Pools
// ---------------------------------------------------------------------------

export function createMockExamPool(overrides: Record<string, unknown> = {}) {
  const status = overrides.status as string | undefined
  const base =
    status === 'NEAR_FULL'
      ? mockNearFullPool
      : status === 'CONFIRMED'
        ? mockConfirmedPool
        : mockPool

  return {
    ...base,
    ...overrides,
    id: overrides.id ?? base.id,
  }
}

export function createMockExamEvent(overrides: Record<string, unknown> = {}) {
  return {
    id: 'event-1',
    name: 'March 2026 Exam Event',
    examDate: new Date('2026-03-15'),
    status: 'OPEN',
    maxCandidates: 28,
    currentRegistrations: 10,
    ...overrides,
  }
}

export function createMockExamSitting(overrides: Record<string, unknown> = {}) {
  return {
    id: 'sitting-1',
    eventId: 'event-1',
    dayNumber: 1,
    sessionType: 'THEORY',
    examDate: new Date('2026-03-15'),
    startTime: new Date('2026-03-15T09:00:00Z'),
    endTime: new Date('2026-03-15T12:00:00Z'),
    maxCandidates: 28,
    ...overrides,
  }
}

export function createMockExamResult(overrides: Record<string, unknown> = {}) {
  return {
    id: 'result-1',
    sittingId: 'sitting-1',
    userId: 'student-1',
    score: 85,
    grade: 'B',
    passed: true,
    ...overrides,
  }
}

export function createMockExamBooking(overrides: Record<string, unknown> = {}) {
  return {
    id: 'booking-1',
    userId: 'student-1',
    examComponentId: 'comp-1',
    examPoolId: 'pool-1',
    status: 'RESERVED',
    amountReserved: 300,
    ...overrides,
  }
}

export function createMockPoolMembership(overrides: Record<string, unknown> = {}) {
  return {
    ...mockMembership,
    ...overrides,
    id: overrides.id ?? mockMembership.id,
  }
}

// ---------------------------------------------------------------------------
// Finance
// ---------------------------------------------------------------------------

export function createMockWallet(overrides: Record<string, unknown> = {}) {
  return {
    ...mockWallet,
    ...overrides,
    id: overrides.id ?? mockWallet.id,
  }
}

export function createMockPayment(overrides: Record<string, unknown> = {}) {
  return {
    ...mockPayment,
    ...overrides,
    id: overrides.id ?? mockPayment.id,
  }
}

export function createMockWalletTransaction(overrides: Record<string, unknown> = {}) {
  const type = overrides.type as string | undefined
  const base = type === 'TOP_UP' ? mockTopUpTransaction : mockReserveTransaction

  return {
    ...base,
    ...overrides,
    id: overrides.id ?? base.id,
  }
}

// ---------------------------------------------------------------------------
// Academic
// ---------------------------------------------------------------------------

export function createMockCourse(overrides: Record<string, unknown> = {}) {
  return {
    id: 'course-1',
    name: 'EASA Part-66 Module 1',
    code: 'MOD-01',
    category: 'THEORY',
    status: 'ACTIVE',
    duration: 40,
    ...overrides,
  }
}

export function createMockEnrollment(overrides: Record<string, unknown> = {}) {
  return {
    id: 'enrollment-1',
    userId: 'student-1',
    courseId: 'course-1',
    status: 'ACTIVE',
    enrolledAt: new Date('2026-01-15'),
    ...overrides,
  }
}

export function createMockGrade(overrides: Record<string, unknown> = {}) {
  return {
    id: 'grade-1',
    userId: 'student-1',
    classId: 'class-1',
    score: 85,
    grade: 'B',
    passed: true,
    ...overrides,
  }
}

export function createMockClass(overrides: Record<string, unknown> = {}) {
  return {
    id: 'class-1',
    courseId: 'course-1',
    instructorId: 'instructor-1',
    name: 'Module 1 - January 2026',
    status: 'ACTIVE',
    startDate: new Date('2026-01-15'),
    endDate: new Date('2026-03-15'),
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Audit & Settings
// ---------------------------------------------------------------------------

export function createMockAuditLog(overrides: Record<string, unknown> = {}) {
  return {
    id: 'audit-1',
    action: 'USER_ROLE_CHANGED',
    userId: 'admin-1',
    targetUserId: 'user-1',
    description: 'STUDENT → INSTRUCTOR',
    changes: { before: { role: 'STUDENT' }, after: { role: 'INSTRUCTOR' } },
    createdAt: new Date(),
    ...overrides,
  }
}

export function createMockSystemSetting(overrides: Record<string, unknown> = {}) {
  return {
    id: 'setting-1',
    key: 'ACADEMIC_YEAR',
    value: '2026',
    type: 'STRING',
    description: 'Current academic year',
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Notifications & Messages
// ---------------------------------------------------------------------------

export function createMockNotification(overrides: Record<string, unknown> = {}) {
  return {
    id: 'notif-1',
    userId: 'student-1',
    title: 'Payment Approved',
    message: 'Your wallet has been topped up',
    read: false,
    createdAt: new Date(),
    ...overrides,
  }
}

export function createMockMessage(overrides: Record<string, unknown> = {}) {
  return {
    id: 'msg-1',
    senderId: 'staff-1',
    recipientId: 'student-1',
    subject: 'Welcome',
    body: 'Welcome to Aerojet Academy',
    isRead: false,
    createdAt: new Date(),
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Convenience re-exports from fixtures
// ---------------------------------------------------------------------------

export { mockAdmin, mockStudent, mockApplicant, mockInstructor }
export { mockPool, mockNearFullPool, mockConfirmedPool, mockMembership }
export { mockWallet, mockTopUpTransaction, mockReserveTransaction, mockPayment }
