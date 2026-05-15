import { NextRequest } from 'next/server'
import { getAuthSession } from '@/lib/auth/helpers'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { EASA_DEFAULTS, isInternalExamSystemEnabled } from '@/lib/internal-exam/engine'

/**
 * GET /api/student/exams/internal/progress
 * Returns the student's internal exam progress, including:
 * - Per-bank attempt history and pass/fail status
 * - 10-year completion window tracking
 * - Overall module progress
 */
export const GET = withErrorHandler(async (_req: NextRequest, _ctx: any) => {
  const session = await getAuthSession()
  if (!session?.user?.id) return apiError('Unauthorized', 401)
  if (!(await isInternalExamSystemEnabled())) {
    return apiError('Internal exams are not currently available', 403)
  }

  const studentId = session.user.id

  const user = await prismaUnfiltered.user.findUnique({
    where: { id: studentId },
    select: {
      role: true,
      email: true,
      profile: {
        select: {
          firstName: true,
          lastName: true,
          dateOfBirth: true,
          phone: true,
          nationality: true,
        },
      },
      studentProfile: {
        select: {
          studentId: true,
          enrollmentType: true,
          programmeChoice: true,
        },
      },
    },
  })
  if (!user || user.role !== 'STUDENT') {
    return apiError('Only enrolled students may view internal exam progress', 403)
  }

  // Get all exam banks the student has attempted
  const sessions = await prismaUnfiltered.internalExamSession.findMany({
    where: { studentId },
    include: {
      bank: {
        select: {
          id: true,
          name: true,
          moduleCode: true,
          course: { select: { name: true, code: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Group by bank
  const byBank: Record<string, {
    bank: any
    attempts: any[]
    passed: boolean
    bestScore: number
    latestAttempt: Date | null
    retakeEligibleAt: Date | null
    banned: boolean
    banLiftDate: Date | null
  }> = {}

  for (const s of sessions) {
    if (!byBank[s.bankId]) {
      byBank[s.bankId] = {
        bank: s.bank,
        attempts: [],
        passed: false,
        bestScore: 0,
        latestAttempt: null,
        retakeEligibleAt: null,
        banned: false,
        banLiftDate: null,
      }
    }
    const entry = byBank[s.bankId]
    entry.attempts.push({
      id: s.id,
      attemptNumber: s.attemptNumber,
      status: s.status,
      score: s.score,
      totalPoints: s.totalPoints,
      percentage: s.percentage,
      passed: s.passed,
      submittedAt: s.submittedAt,
    })
    if (s.passed) entry.passed = true
    if (s.percentage && s.percentage > entry.bestScore) entry.bestScore = s.percentage
    if (!entry.latestAttempt || (s.submittedAt && s.submittedAt > entry.latestAttempt)) {
      entry.latestAttempt = s.submittedAt
    }
    if (s.retakeEligibleAt) entry.retakeEligibleAt = s.retakeEligibleAt
    if (s.banLiftDate && s.banLiftDate > new Date()) {
      entry.banned = true
      entry.banLiftDate = s.banLiftDate
    }
  }

  // 10-year completion window
  const firstAttempt = sessions.length > 0
    ? sessions.reduce((earliest, s) => {
        const t = s.createdAt
        return !earliest || t < earliest ? t : earliest
      }, null as Date | null)
    : null

  let completionWindow = null
  if (firstAttempt) {
    const deadline = new Date(firstAttempt)
    deadline.setFullYear(deadline.getFullYear() + EASA_DEFAULTS.completionWindowYears)
    const now = new Date()
    const totalMs = deadline.getTime() - firstAttempt.getTime()
    const elapsedMs = now.getTime() - firstAttempt.getTime()
    const percentElapsed = Math.round((elapsedMs / totalMs) * 100)

    completionWindow = {
      startDate: firstAttempt.toISOString(),
      deadline: deadline.toISOString(),
      yearsTotal: EASA_DEFAULTS.completionWindowYears,
      percentElapsed: Math.min(100, percentElapsed),
      remainingDays: Math.max(0, Math.ceil((deadline.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))),
    }
  }

  const enrollments = await prismaUnfiltered.enrollment.findMany({
    where: {
      userId: studentId,
      status: { in: ['ENROLLED', 'ACTIVE', 'APPROVED'] },
    },
    select: { courseId: true },
  })
  const enrolledCourseIds = [...new Set(enrollments.map((enrollment) => enrollment.courseId))]

  // Only show banks tied to courses the student can actually access.
  const allBanks = await prismaUnfiltered.internalExamBank.findMany({
    where: {
      isActive: true,
      courseId: { in: enrolledCourseIds },
    },
    select: {
      id: true,
      name: true,
      moduleCode: true,
      course: { select: { name: true, code: true } },
    },
  })

  const bankProgress = allBanks.map(bank => {
    const progress = byBank[bank.id]
    return {
      bankId: bank.id,
      bankName: bank.name,
      moduleCode: bank.moduleCode,
      courseName: bank.course.name,
      courseCode: bank.course.code,
      attempted: !!progress,
      passed: progress?.passed || false,
      bestScore: progress?.bestScore || 0,
      totalAttempts: progress?.attempts.length || 0,
      banned: progress?.banned || false,
      banLiftDate: progress?.banLiftDate?.toISOString() || null,
      retakeEligibleAt: progress?.retakeEligibleAt?.toISOString() || null,
    }
  })

  const totalBanks = allBanks.length
  const passedBanks = bankProgress.filter(b => b.passed).length

  return apiSuccess({
    studentDetails: {
      name: user.profile ? `${user.profile.firstName} ${user.profile.lastName}` : session.user.email,
      email: user.email,
      studentId: user.studentProfile?.studentId || null,
      dateOfBirth: user.profile?.dateOfBirth?.toISOString() || null,
      phone: user.profile?.phone || null,
      nationality: user.profile?.nationality || null,
      enrollmentType: user.studentProfile?.enrollmentType || null,
      programmeChoice: user.studentProfile?.programmeChoice || null,
    },
    bankProgress,
    completionWindow,
    summary: {
      totalModules: totalBanks,
      passedModules: passedBanks,
      progressPercent: totalBanks > 0 ? Math.round((passedBanks / totalBanks) * 100) : 0,
    },
  })
})
