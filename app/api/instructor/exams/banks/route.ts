import { NextRequest } from 'next/server'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { requireInstructor } from '@/lib/auth/helpers'
import {
  apiPaginated,
  apiError,
  apiForbidden,
  apiCreated,
  withErrorHandler,
} from '@/lib/api/response'
import { parsePagination } from '@/lib/api/response'
import { getInstructorProfileByUserId } from '@/lib/instructor/profile'
import { isInternalExamSystemEnabled } from '@/lib/internal-exam/engine'
import { AuditAction, createAuditLog } from '@/lib/audit/logger'
import { getRequestContext } from '@/lib/server/request-context'
import { z } from 'zod'

const createBankSchema = z.object({
  courseId: z.string().min(1, 'courseId is required'),
  name: z.string().min(1, 'name is required'),
  description: z.string().optional(),
  moduleCode: z.string().optional(),
  mcqCount: z.number().int().min(5).max(200).optional().default(40),
})

export const GET = withErrorHandler(async (req: NextRequest) => {
  const user = await requireInstructor()
  const instructorProfile = await getInstructorProfileByUserId(user.id)
  if (!instructorProfile) return apiForbidden('Instructor profile not found')

  if (!(await isInternalExamSystemEnabled())) {
    return apiError('Internal exams are not currently available', 403)
  }

  const { searchParams } = new URL(req.url)
  const { page, limit, skip } = parsePagination(searchParams)
  const scope = searchParams.get('scope') || 'mine'

  let bankIds: string[] = []

  if (scope === 'mine') {
    const assignments = await prismaUnfiltered.internalExamBankInstructor.findMany({
      where: { instructorId: instructorProfile.id },
      select: { bankId: true },
    })
    bankIds = assignments.map((a) => a.bankId)
  } else if (scope === 'module') {
    const classes = await prismaUnfiltered.class.findMany({
      where: { instructorId: instructorProfile.id },
      select: { courseId: true },
    })
    const courseIds = [...new Set(classes.map((c) => c.courseId))]
    if (courseIds.length > 0) {
      const banks = await prismaUnfiltered.internalExamBank.findMany({
        where: { courseId: { in: courseIds } },
        select: { id: true },
      })
      bankIds = banks.map((b) => b.id)
    }
  }

  if (bankIds.length === 0 && scope !== 'module') {
    return apiPaginated([], 0, page, limit)
  }

  // For `module` scope we also surface modules the instructor teaches that
  // have no bank yet, so they can create one from the UI.
  let pendingBanklessCourses: { id: string; name: string; code: string }[] = []
  if (scope === 'module') {
    const classes = await prismaUnfiltered.class.findMany({
      where: { instructorId: instructorProfile.id },
      select: { courseId: true },
    })
    const taughtCourseIds = [...new Set(classes.map((c) => c.courseId))]
    if (taughtCourseIds.length > 0) {
      const existingBanks = await prismaUnfiltered.internalExamBank.findMany({
        where: { courseId: { in: taughtCourseIds } },
        select: { courseId: true },
      })
      const covered = new Set(existingBanks.map((b) => b.courseId))
      const bankless = taughtCourseIds.filter((id) => !covered.has(id))
      if (bankless.length > 0) {
        const courses = await prismaUnfiltered.course.findMany({
          where: { id: { in: bankless } },
          select: { id: true, name: true, code: true },
        })
        pendingBanklessCourses = courses
      }
    }
  }

  const [banks, total] = await Promise.all([
    bankIds.length > 0
      ? prismaUnfiltered.internalExamBank.findMany({
          where: { id: { in: bankIds } },
          include: {
            course: { select: { id: true, name: true, code: true } },
            ruleOverride: true,
            _count: {
              select: {
                questions: { where: { status: 'APPROVED', isActive: true } },
                sessions: true,
              },
            },
          },
          // Natural sort by moduleCode after fetch to ensure M2 < M10
          // Prisma string ASC is lexicographic and breaks numeric module codes.
          // take/skip are applied before sort, so we must sort the in-memory array.
          // For very large datasets, consider a dedicated numeric sort column.
          take: limit,
          skip,
        })
      : Promise.resolve([]),
    prismaUnfiltered.internalExamBank.count({ where: { id: { in: bankIds } } }),
  ])

  // Natural sort by moduleCode
  banks.sort((a, b) =>
    (a.moduleCode || '').localeCompare(b.moduleCode || '', undefined, {
      numeric: true,
      sensitivity: 'base',
    })
  )

  const pendingCounts = bankIds.length
    ? await prismaUnfiltered.internalExamQuestion.groupBy({
        by: ['bankId'],
        where: { bankId: { in: bankIds }, status: 'PENDING_APPROVAL', isActive: true },
        _count: true,
      })
    : []
  const pendingMap = Object.fromEntries(pendingCounts.map((pc) => [pc.bankId, pc._count]))

  const enrichedBanks = banks.map((bank) => {
    const questionCount = bank._count?.questions ?? 0
    const requiredMinimum = bank.minimumPoolSize ?? bank.mcqCount * 5
    const ratio = requiredMinimum > 0 ? questionCount / requiredMinimum : 0
    const health = ratio >= 1.0 ? 'GREEN' : ratio >= 0.6 ? 'AMBER' : 'RED'
    return {
      ...bank,
      poolHealth: { health, questionCount, requiredMinimum },
      pendingCount: pendingMap[bank.id] || 0,
    }
  })

  // Natural sort by moduleCode before pagination so M2 comes before M10.
  enrichedBanks.sort((a, b) =>
    (a.moduleCode || '').localeCompare(b.moduleCode || '', undefined, {
      numeric: true,
      sensitivity: 'base',
    })
  )

  // Bankless placeholders so the UI can offer "Create bank" inline.
  const banklessEntries = pendingBanklessCourses.map((c) => ({
    id: `bankless:${c.id}`,
    courseId: c.id,
    course: c,
    name: `${c.code} Module Exam`,
    description: null,
    mcqCount: 40,
    minimumPoolSize: 200,
    isActive: true,
    reviewState: 'DRAFT' as const,
    ruleOverride: null,
    poolHealth: { health: 'RED', questionCount: 0, requiredMinimum: 200 },
    pendingCount: 0,
    questionCount: 0,
    bankless: true,
  }))

  const allEntries = [...enrichedBanks, ...banklessEntries]
  const paginated = allEntries.slice(skip, skip + limit)

  return apiPaginated(paginated, allEntries.length, page, limit)
})

/**
 * POST — create a question bank for a module the instructor teaches.
 *
 * The instructor must currently teach at least one class on `courseId`.
 * One bank per course is enforced via a unique lookup (idempotent — re-creating
 * a bank for a course that already has one returns the existing bank with 200).
 */
export const POST = withErrorHandler(async (req: NextRequest) => {
  const user = await requireInstructor()
  const instructorProfile = await getInstructorProfileByUserId(user.id)
  if (!instructorProfile) return apiForbidden('Instructor profile not found')

  if (!(await isInternalExamSystemEnabled())) {
    return apiError('Internal exams are not currently available', 403)
  }

  const body = await req.json()
  const parsed = createBankSchema.safeParse(body)
  if (!parsed.success) {
    return apiError(
      parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      400
    )
  }
  const { courseId, name, description, moduleCode, mcqCount } = parsed.data

  // Authorization: instructor must teach a class on this course.
  const ownsClass = await prismaUnfiltered.class.count({
    where: { courseId, instructorId: instructorProfile.id },
  })
  if (ownsClass === 0) {
    return apiForbidden('You can only create a bank for a course you teach')
  }

  // Idempotency: if a bank already exists for this course, return it.
  const existing = await prismaUnfiltered.internalExamBank.findFirst({
    where: { courseId },
  })
  if (existing) {
    return apiCreated(existing)
  }

  const bank = await prismaUnfiltered.internalExamBank.create({
    data: {
      courseId,
      name,
      description: description ?? null,
      moduleCode: moduleCode ?? null,
      mcqCount,
      minimumPoolSize: mcqCount * 5,
      reviewState: 'DRAFT',
    },
  })

  // Auto-assign the creating instructor as an editor on the new bank.
  await prismaUnfiltered.internalExamBankInstructor.upsert({
    where: {
      bankId_instructorId: {
        bankId: bank.id,
        instructorId: instructorProfile.id,
      },
    },
    update: { canEdit: true, canReview: true, canMonitor: true },
    create: {
      bankId: bank.id,
      instructorId: instructorProfile.id,
      canEdit: true,
      canReview: true,
      canMonitor: true,
      assignedBy: user.id,
    },
  })

  const ctx = await getRequestContext()
  await createAuditLog({
    userId: user.id,
    action: AuditAction.CREATE,
    entity: 'InternalExamBank',
    entityId: bank.id,
    description: `Instructor created module bank "${bank.name}" for course ${courseId}`,
    changes: { courseId, name, mcqCount },
    ipAddress: ctx.ipAddress ?? undefined,
    userAgent: ctx.userAgent ?? undefined,
  })

  return apiCreated(bank)
})
