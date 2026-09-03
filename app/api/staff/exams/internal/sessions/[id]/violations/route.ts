import { NextRequest } from 'next/server'
import { requireStaff } from '@/lib/auth/helpers'
import {
  apiSuccess,
  apiError,
  apiPaginated,
  withErrorHandler,
  parsePagination,
  parseSorting,
  parseSearch,
} from '@/lib/api/response'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { createAuditLog, AuditAction } from '@/lib/audit/logger'
import { z } from 'zod'

const outcomeSchema = z.enum(['PENDING', 'GRACIOUS', 'STRICT', 'DISMISSED'])

const patchSchema = z.object({
  violationId: z.string().optional(),
  violationIds: z.array(z.string()).min(1).optional(),
  outcome: outcomeSchema,
  reviewNote: z.string().optional(),
})

export const GET = withErrorHandler(
  async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
    await requireStaff()
    const { id: sessionId } = await ctx.params

    const searchParams = new URL(req.url).searchParams
    const { page, limit, skip } = parsePagination(searchParams)
    const { sortBy, sortOrder } = parseSorting(searchParams)
    const search = parseSearch(searchParams)

    const where: Record<string, unknown> = {
      sessionId,
      ...(search
        ? {
            OR: [
              { type: { contains: search } },
              { detail: { contains: search } },
              { reviewOutcome: { contains: search } },
            ],
          }
        : {}),
    }

    const [violations, total] = await Promise.all([
      prismaUnfiltered.internalExamViolation.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
        include: {
          student: {
            select: {
              id: true,
              email: true,
              profile: { select: { firstName: true, lastName: true } },
            },
          },
        },
      }),
      prismaUnfiltered.internalExamViolation.count({ where }),
    ])

    return apiPaginated(
      violations.map((v) => ({
        id: v.id,
        type: v.type,
        severity: v.severity,
        detail: v.detail,
        deviceInfo: v.deviceInfo,
        reviewOutcome: v.reviewOutcome,
        reviewedAt: v.reviewedAt?.toISOString() ?? null,
        reviewedBy: v.reviewedBy ?? null,
        createdAt: v.createdAt.toISOString(),
        student: v.student
          ? {
              id: v.student.id,
              name: v.student.profile
                ? `${v.student.profile.firstName} ${v.student.profile.lastName}`
                : v.student.email,
              email: v.student.email,
            }
          : null,
      })),
      total,
      page,
      limit
    )
  }
)

export const PATCH = withErrorHandler(
  async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
    const staff = await requireStaff()
    const { id: sessionId } = await ctx.params

    const body = await req.json()
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) {
      return apiError(
        parsed.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join('; '),
        400
      )
    }

    const { violationId, violationIds, outcome, reviewNote } = parsed.data

    const ids = violationId ? [violationId] : violationIds ? [...violationIds] : []

    if (ids.length === 0) return apiError('violationId or violationIds is required')

    const found = await prismaUnfiltered.internalExamViolation.findMany({
      where: { id: { in: ids }, sessionId },
      select: { id: true },
    })
    if (found.length !== ids.length)
      return apiError('One or more violations not found for this session', 404)

    const updated = await prismaUnfiltered.internalExamViolation.updateMany({
      where: { id: { in: ids }, sessionId },
      data: {
        reviewOutcome: outcome,
        reviewNote: reviewNote || null,
        reviewedBy: staff.id,
        reviewedAt: new Date(),
      },
    })

    await createAuditLog({
      userId: staff.id,
      action: AuditAction.EXAM_VIOLATION_REVIEWED,
      entity: 'InternalExamViolation',
      entityId: sessionId,
      description: `Reviewed ${updated.count} violation(s) — outcome: ${outcome} by staff ${staff.id}`,
      changes: { violationIds: ids, outcome, reviewNote: reviewNote || null },
    })

    return apiSuccess({ updated: updated.count, outcome })
  }
)
