import { NextRequest } from 'next/server'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { requireInstructor } from '@/lib/auth/helpers'
import { apiSuccess, apiError, apiForbidden, apiNotFound, withErrorHandler } from '@/lib/api/response'
import { getInstructorProfileByUserId } from '@/lib/instructor/profile'
import { isInternalExamSystemEnabled, getBankRules } from '@/lib/internal-exam/engine'
import { AuditAction, createAuditLog } from '@/lib/audit/logger'

/**
 * POST /api/instructor/exams/classes/[classId]/start
 *
 * Starts a live internal exam for every enrolled student in the class.
 * Creates an `IN_PROGRESS` session (with `startedAt`/`expiresAt`) per student
 * for the class's scheduled bank, skipping any student who already has a
 * non-voided session. The Live Monitor tab then reflects these as "Active".
 */
export const POST = withErrorHandler(
  async (req: NextRequest, ctx: { params: Promise<{ classId: string }> }) => {
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

    const body = await req.json().catch(() => ({}))

    let bankId: string | undefined = body?.bankId
    if (!bankId) {
      const schedule = await prismaUnfiltered.internalExamClassSchedule.findFirst({
        where: { classId, isActive: true },
        orderBy: { createdAt: 'desc' },
        select: { bankId: true },
      })
      bankId = schedule?.bankId
    }
    if (!bankId) return apiError('No exam bank is scheduled for this class', 400)

    const bank = await prismaUnfiltered.internalExamBank.findUnique({
      where: { id: bankId },
      select: { id: true, name: true, mcqCount: true, ruleSet: true },
    })
    if (!bank) return apiError('Bank not found', 404)

    const rules = await getBankRules(bankId)
    const totalSeconds = rules.timePerQuestionSecs * (bank.mcqCount || 40)
    const now = new Date()
    const expiresAt = new Date(now.getTime() + totalSeconds * 1000)

    const enrollments = await prismaUnfiltered.enrollment.findMany({
      where: { courseId: classItem.courseId, status: 'ENROLLED' },
      select: { userId: true },
    })

    if (enrollments.length === 0) {
      return apiSuccess({ started: 0, skipped: 0, failed: 0, details: [] })
    }

    let started = 0
    let skipped = 0
    let failed = 0
    const details: { userId: string; status: string }[] = []

    for (const enrollment of enrollments) {
      try {
        const existing = await prismaUnfiltered.internalExamSession.findFirst({
          where: { studentId: enrollment.userId, bankId, classId, status: { not: 'VOIDED' } },
          select: { id: true, status: true },
        })

        if (existing) {
          skipped++
          details.push({ userId: enrollment.userId, status: `skipped:${existing.status}` })
          continue
        }

        await prismaUnfiltered.internalExamSession.create({
          data: {
            studentId: enrollment.userId,
            bankId,
            classId,
            ruleSet: bank.ruleSet || 'EASA',
            status: 'IN_PROGRESS',
            startedAt: now,
            expiresAt,
          },
        })
        started++
        details.push({ userId: enrollment.userId, status: 'started' })
      } catch {
        failed++
        details.push({ userId: enrollment.userId, status: 'failed' })
      }
    }

    await createAuditLog({
      userId: user.id,
      action: AuditAction.EXAM_SESSION_STARTED,
      entity: 'InternalExamSession',
      entityId: `class:${classId}:bank:${bankId}`,
      description: `Started live exam ${bank.name} for class ${classItem.name}: ${started} started, ${skipped} skipped, ${failed} failed`,
      changes: { bankId, classId, started, skipped, failed, totalStudents: enrollments.length },
    })

    return apiSuccess({ started, skipped, failed, details })
  }
)
