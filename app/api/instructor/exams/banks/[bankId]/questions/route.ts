import { NextRequest } from 'next/server'
import { Prisma } from '@prisma/client'
import { requireInstructor } from '@/lib/auth/helpers'
import { apiSuccess, apiError, apiCreated, apiForbidden, withErrorHandler , RouteContext } from '@/lib/api/response'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { isInternalExamSystemEnabled } from '@/lib/internal-exam/engine'
import { AuditAction, createAuditLog } from '@/lib/audit/logger'
import { getInstructorProfileByUserId } from '@/lib/instructor/profile'
import { z } from 'zod'

const questionSchema = z.object({
  text: z.string().min(1),
  options: z.array(z.string()).min(3).max(3),
  correctAnswer: z.string(),
  subTopic: z.string().optional(),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).default('MEDIUM'),
  points: z.number().min(1).default(1),
  syllabusRef: z.string().optional(),
  knowledgeLevel: z.number().int().min(1).max(3).optional(),
  explanation: z.string().optional(),
}).refine((data) => data.options.includes(data.correctAnswer), {
  message: 'correctAnswer must be one of the provided options',
  path: ['correctAnswer'],
})

const QUESTION_STATUS_VALUES = ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED'] as const

/** Sort keys accepted by GET /banks/:bankId/questions. Defaults to `recent`. */
const SORT_VALUES = [
  'recent', // createdAt desc
  'oldest', // createdAt asc
  'author', // submittedBy.profile.firstName asc, createdAt desc
  'difficulty_desc', // EASY < MEDIUM < HARD desc
  'difficulty_asc', // HARD < MEDIUM < EASY asc
  'status', // status asc, createdAt desc
  'subtopic', // subTopic asc nulls last, createdAt desc
  'served', // timesServed desc
] as const
type QuestionSort = (typeof SORT_VALUES)[number]

const DIFFICULTY_RANK: Record<string, number> = { EASY: 1, MEDIUM: 2, HARD: 3 }

export const GET = withErrorHandler(
  async (req: NextRequest, ctx?: RouteContext) => {
    const user = await requireInstructor()
    const instructorProfile = await getInstructorProfileByUserId(user.id)
    if (!instructorProfile) return apiForbidden('Instructor profile not found')

    if (!(await isInternalExamSystemEnabled())) {
      return apiError('Internal exams are not currently available', 403)
    }
    const { bankId } = (await ctx!.params) as { bankId: string }

    const grant = await prismaUnfiltered.internalExamBankInstructor.findFirst({
      where: { bankId, instructorId: instructorProfile.id },
      select: { canMonitor: true, canEdit: true },
    })
    if (!grant?.canMonitor && !grant?.canEdit) {
      return apiForbidden('You do not have access to this bank')
    }

    const url = new URL(req.url)
    const status = url.searchParams.get('status')
    const sortParam = url.searchParams.get('sort') as QuestionSort | null

    let statusValue: (typeof QUESTION_STATUS_VALUES)[number] | undefined
    if (status) {
      const parsed = z.enum(QUESTION_STATUS_VALUES).safeParse(status)
      if (!parsed.success) {
        return apiError(`Invalid status; must be one of ${QUESTION_STATUS_VALUES.join(' | ')}`, 400)
      }
      statusValue = parsed.data
    }

    let sort: QuestionSort = 'recent'
    if (sortParam) {
      const parsed = z.enum(SORT_VALUES).safeParse(sortParam)
      if (!parsed.success) {
        return apiError(`Invalid sort; must be one of ${SORT_VALUES.join(' | ')}`, 400)
      }
      sort = parsed.data
    }

    const where: Prisma.InternalExamQuestionWhereInput = {
      bankId,
      ...(statusValue ? { status: statusValue } : {}),
    }

    // Build the Prisma orderBy from the requested sort key.
    // author / status / subtopic sorts need to be applied in JS because
    // they reference related fields that Prisma can't order across for this model.
    const orderBy: Prisma.InternalExamQuestionOrderByWithRelationInput[] =
      sort === 'recent'
        ? [{ createdAt: 'desc' }]
        : sort === 'oldest'
          ? [{ createdAt: 'asc' }]
          : sort === 'difficulty_desc'
            ? [{ difficulty: 'desc' }, { createdAt: 'desc' }]
            : sort === 'difficulty_asc'
              ? [{ difficulty: 'asc' }, { createdAt: 'desc' }]
              : sort === 'served'
                ? [{ timesServed: 'desc' }, { createdAt: 'desc' }]
                : // Pull in a stable order; the JS pass below re-sorts for these keys.
                  [{ createdAt: 'desc' }]

    const questions = await prismaUnfiltered.internalExamQuestion.findMany({
      where,
      orderBy,
    })

    // Hydrate the submitter profile for display + sort.
    const submitterIds = Array.from(
      new Set(questions.map((q) => q.submittedById).filter((id): id is string => Boolean(id)))
    )
    const submitters = submitterIds.length
      ? await prismaUnfiltered.user.findMany({
          where: { id: { in: submitterIds } },
          select: {
            id: true,
            profile: { select: { firstName: true, lastName: true } },
          },
        })
      : []
    const submitterMap = new Map(submitters.map((s) => [s.id, s]))

    const enriched = questions.map((q) => ({
      ...q,
      submittedBy: q.submittedById ? submitterMap.get(q.submittedById) ?? null : null,
    }))

    // JS-side sorts that Prisma can't express.
    if (sort === 'author') {
      const authorKey = (a: (typeof enriched)[number]) =>
        [a.submittedBy?.profile?.firstName, a.submittedBy?.profile?.lastName]
          .filter(Boolean)
          .join(' ') || 'zzz'
      enriched.sort((a, b) => {
        const cmp = authorKey(a).localeCompare(authorKey(b), undefined, { sensitivity: 'base' })
        if (cmp !== 0) return cmp
        return b.createdAt.getTime() - a.createdAt.getTime()
      })
    } else if (sort === 'status') {
      const order: Record<string, number> = {
        DRAFT: 0,
        PENDING_APPROVAL: 1,
        APPROVED: 2,
        REJECTED: 3,
      }
      enriched.sort((a, b) => {
        const cmp = (order[a.status] ?? 99) - (order[b.status] ?? 99)
        if (cmp !== 0) return cmp
        return b.createdAt.getTime() - a.createdAt.getTime()
      })
    } else if (sort === 'subtopic') {
      enriched.sort((a, b) => {
        const aHas = a.subTopic ? 0 : 1
        const bHas = b.subTopic ? 0 : 1
        if (aHas !== bHas) return aHas - bHas
        const cmp = (a.subTopic ?? '').localeCompare(b.subTopic ?? '', undefined, {
          sensitivity: 'base',
        })
        if (cmp !== 0) return cmp
        return b.createdAt.getTime() - a.createdAt.getTime()
      })
    } else if (sort === 'difficulty_desc' || sort === 'difficulty_asc') {
      // Re-stabilize by applying a numeric rank (so EASY < MEDIUM < HARD on asc).
      enriched.sort((a, b) => {
        const aRank = DIFFICULTY_RANK[a.difficulty] ?? 99
        const bRank = DIFFICULTY_RANK[b.difficulty] ?? 99
        const cmp = sort === 'difficulty_desc' ? bRank - aRank : aRank - bRank
        if (cmp !== 0) return cmp
        return b.createdAt.getTime() - a.createdAt.getTime()
      })
    }

    return apiSuccess(enriched)
  }
)

export const POST = withErrorHandler(
  async (req: NextRequest, ctx?: RouteContext) => {
    const user = await requireInstructor()
    const instructorProfile = await getInstructorProfileByUserId(user.id)
    if (!instructorProfile) return apiForbidden('Instructor profile not found')

    if (!(await isInternalExamSystemEnabled())) {
      return apiError('Internal exams are not currently available', 403)
    }
    const { bankId } = (await ctx!.params) as { bankId: string }

    const grant = await prismaUnfiltered.internalExamBankInstructor.findFirst({
      where: { bankId, instructorId: instructorProfile.id },
      select: { canEdit: true },
    })
    if (!grant?.canEdit) {
      return apiForbidden('You do not have permission to add questions to this bank')
    }

    const body = await req.json()
    const parsed = questionSchema.safeParse(body)
    if (!parsed.success) {
      return apiError(parsed.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join('; '), 400)
    }

    const question = await prismaUnfiltered.internalExamQuestion.create({
      data: {
        bankId,
        text: parsed.data.text,
        options: parsed.data.options,
        correctAnswer: parsed.data.correctAnswer,
        subTopic: parsed.data.subTopic || null,
        difficulty: parsed.data.difficulty,
        points: parsed.data.points,
        syllabusRef: parsed.data.syllabusRef || null,
        knowledgeLevel: parsed.data.knowledgeLevel || null,
        explanation: parsed.data.explanation || null,
        status: 'PENDING_APPROVAL',
        submittedById: user.id,
      },
    })

    await createAuditLog({
      userId: user.id,
      action: AuditAction.EXAM_QUESTION_CREATED,
      entity: 'InternalExamQuestion',
      entityId: question.id,
      description: `Question created in bank ${bankId}`,
      changes: {
        questionId: question.id,
        bankId,
        text: question.text,
        points: question.points,
        difficulty: question.difficulty,
      },
    })

    return apiCreated(question)
  }
)
