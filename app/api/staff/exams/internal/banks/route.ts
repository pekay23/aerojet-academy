import { NextRequest } from 'next/server'
import { requireStaff } from '@/lib/auth/helpers'
import {
  apiSuccess,
  apiError,
  apiCreated,
  withErrorHandler,
} from '@/lib/api/response'
import type { Prisma } from '@prisma/client'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { isInternalExamSystemEnabled } from '@/lib/internal-exam/engine'
import { getInternalBankCategoryCode, normalizeCategoryCode } from '@/lib/easa/category-selection'
import {
  calculateMinimumPoolSize,
} from '@/lib/easa/module-requirements'
import { z } from 'zod'

// GET — list all exam banks with pool health
export const GET = withErrorHandler(async (req: NextRequest) => {
  await requireStaff()
  if (!(await isInternalExamSystemEnabled())) {
    return apiError('Internal exams are not currently available', 403)
  }
  const url = new URL(req.url)
  const courseId = url.searchParams.get('courseId')

  const where: Prisma.InternalExamBankWhereInput = {}
  if (courseId) where.courseId = courseId

  const banks = await prismaUnfiltered.internalExamBank.findMany({
    where,
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
  })

  // Natural sort by moduleCode so M2 comes before M10, M11A, etc.
  banks.sort((a, b) =>
    (a.moduleCode || '').localeCompare(b.moduleCode || '', undefined, {
      numeric: true,
      sensitivity: 'base',
    })
  )

  const pendingCounts = await prismaUnfiltered.internalExamQuestion.groupBy({
    by: ['bankId'],
    where: {
      bankId: { in: banks.map((b) => b.id) },
      status: 'PENDING_APPROVAL',
      isActive: true,
    },
    _count: true,
  })
  const pendingMap = Object.fromEntries(pendingCounts.map((pc) => [pc.bankId, pc._count]))

  // Compute pool health inline from _count to avoid N+1 queries
  const enriched = banks.map((bank) => {
    const questionCount = bank._count.questions
    // Use EASA-aware minimum pool size if module code is present
    const easaMinimum = bank.moduleCode
      ? calculateMinimumPoolSize(bank.moduleCode, bank.categoryCode)
      : null
    const fallbackMinimum = bank.minimumPoolSize ?? bank.mcqCount * 5
    const requiredMinimum = easaMinimum ?? fallbackMinimum
    const ratio = requiredMinimum > 0 ? questionCount / requiredMinimum : 0
    const health = ratio >= 1.0 ? 'GREEN' : ratio >= 0.6 ? 'AMBER' : 'RED'
    return {
      ...bank,
      categoryCode: getInternalBankCategoryCode(bank),
      poolHealth: { health, questionCount, requiredMinimum },
      pendingCount: pendingMap[bank.id] || 0,
    }
  })

  return apiSuccess(enriched)
})

// POST — create new exam bank
const createSchema = z.object({
  courseId: z.string(),
  name: z.string().min(1),
  description: z.string().optional(),
  moduleCode: z.string().optional(),
  categoryCode: z.string().optional(),
  mcqCount: z.number().min(5).default(40),
  ruleSet: z.enum(['EASA', 'CUSTOM']).default('EASA'),
})

export const POST = withErrorHandler(async (req: NextRequest) => {
  await requireStaff()
  if (!(await isInternalExamSystemEnabled())) {
    return apiError('Internal exams are not currently available', 403)
  }
  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return apiError('Invalid input')

  const bank = await prismaUnfiltered.internalExamBank.create({
    data: {
      courseId: parsed.data.courseId,
      name: parsed.data.name,
      description: parsed.data.description || null,
      moduleCode: parsed.data.moduleCode || null,
      categoryCode: normalizeCategoryCode(parsed.data.categoryCode),
      mcqCount: parsed.data.mcqCount,
      ruleSet: parsed.data.ruleSet,
      minimumPoolSize: parsed.data.mcqCount * 5,
    },
  })

  return apiCreated(bank)
})
