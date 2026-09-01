import { NextRequest } from 'next/server'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { requireInstructor } from '@/lib/auth/helpers'
import { apiSuccess, apiError, apiForbidden, apiNotFound, withErrorHandler } from '@/lib/api/response'
import { getInstructorProfileByUserId } from '@/lib/instructor/profile'
import { isInternalExamSystemEnabled } from '@/lib/internal-exam/engine'
import { AuditAction, createAuditLog } from '@/lib/audit/logger'

export const GET = withErrorHandler(async (req: NextRequest, ctx: { params: Promise<{ classId: string }> }) => {
  const user = await requireInstructor()
  const instructorProfile = await getInstructorProfileByUserId(user.id)
  if (!instructorProfile) return apiForbidden('Instructor profile not found')

  if (!(await isInternalExamSystemEnabled())) {
    return apiError('Internal exams are not currently available', 403)
  }
  const { classId } = await ctx.params

  const classItem = await prismaUnfiltered.class.findUnique({
    where: { id: classId },
    select: { id: true, instructorId: true, name: true, courseId: true },
  })
  if (!classItem) return apiNotFound('Class not found')
  if (classItem.instructorId !== instructorProfile.id) {
    return apiForbidden('Not assigned to this class')
  }

  const sessions = await prismaUnfiltered.internalExamSession.findMany({
    where: { classId },
    include: {
      student: {
        select: {
          id: true,
          email: true,
          profile: { select: { firstName: true, lastName: true } },
          studentProfile: { select: { studentId: true } },
        },
      },
      bank: {
        select: { id: true, name: true, moduleCode: true, course: { select: { code: true, name: true } } },
      },
      _count: { select: { answers: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const now = new Date()
  const result = sessions.map((s) => {
    const timeRemaining =
      s.status === 'IN_PROGRESS' && s.expiresAt
        ? Math.max(0, Math.floor((s.expiresAt.getTime() - now.getTime()) / 1000))
        : null

    return {
      id: s.id,
      status: s.status,
      student: {
        id: s.student.id,
        name: s.student.profile
          ? `${s.student.profile.firstName} ${s.student.profile.lastName}`
          : s.student.email,
        email: s.student.email,
        studentId: s.student.studentProfile?.studentId || null,
      },
      bank: {
        id: s.bank.id,
        name: s.bank.name,
        moduleCode: s.bank.moduleCode,
        courseCode: s.bank.course.code,
      },
      startedAt: s.startedAt?.toISOString() || null,
      expiresAt: s.expiresAt?.toISOString() || null,
      submittedAt: s.submittedAt?.toISOString() || null,
      score: s.score,
      totalPoints: s.totalPoints,
      percentage: s.percentage,
      passed: s.passed,
      timeRemaining,
      answerCount: s._count.answers,
    }
  })

  return apiSuccess(result)
})

export const POST = withErrorHandler(async (req: NextRequest, ctx: { params: Promise<{ classId: string }> }) => {
  const user = await requireInstructor()
  const instructorProfile = await getInstructorProfileByUserId(user.id)
  if (!instructorProfile) return apiForbidden('Instructor profile not found')

  if (!(await isInternalExamSystemEnabled())) {
    return apiError('Internal exams are not currently available', 403)
  }
  const { classId } = await ctx.params

  const classItem = await prismaUnfiltered.class.findUnique({
    where: { id: classId },
    select: { id: true, instructorId: true, courseId: true, name: true },
  })
  if (!classItem) return apiNotFound('Class not found')
  if (classItem.instructorId !== instructorProfile.id) {
    return apiForbidden('Not assigned to this class')
  }

  const body = await req.json()
  const bankId = body?.bankId
  if (!bankId) return apiError('bankId is required')

  const bank = await prismaUnfiltered.internalExamBank.findUnique({
    where: { id: bankId },
    select: { id: true, name: true, ruleSet: true },
  })
  if (!bank) return apiError('Bank not found', 404)

  const schedule = await prismaUnfiltered.internalExamClassSchedule.findFirst({
    where: { bankId, classId, isActive: true },
  })
  if (!schedule) return apiError('This exam is not scheduled for this class', 400)

  const enrollments = await prismaUnfiltered.enrollment.findMany({
    where: { courseId: classItem.courseId, status: 'ENROLLED' },
    select: { userId: true },
  })

  if (enrollments.length === 0) {
    return apiSuccess({ created: 0, skipped: 0, failed: 0, details: [] })
  }

  let created = 0
  let skipped = 0
  let failed = 0
  const details: { userId: string; status: string }[] = []

  for (const enrollment of enrollments) {
    try {
      const existing = await prismaUnfiltered.internalExamSession.findFirst({
        where: { studentId: enrollment.userId, bankId, classId },
        select: { id: true, status: true },
      })

      if (existing) {
        skipped++
        details.push({ userId: enrollment.userId, status: `skipped: ${existing.status}` })
        continue
      }

      await prismaUnfiltered.internalExamSession.create({
        data: {
          studentId: enrollment.userId,
          bankId,
          classId,
          ruleSet: bank.ruleSet || 'EASA',
          status: 'NOT_STARTED',
        },
      })
      created++
      details.push({ userId: enrollment.userId, status: 'created' })
    } catch (err) {
      failed++
      details.push({ userId: enrollment.userId, status: 'failed' })
    }
  }

  await createAuditLog({
    userId: user.id,
    action: AuditAction.EXAM_SESSION_STARTED,
    entity: 'InternalExamSession',
    entityId: `class:${classId}:bank:${bankId}`,
    description: `Started exam ${bank.name} for class ${classItem.name}: ${created} created, ${skipped} skipped, ${failed} failed`,
    changes: { bankId, classId, created, skipped, failed, totalStudents: enrollments.length },
  })

  return apiSuccess({ created, skipped, failed, details })
})
