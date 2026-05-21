import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { createAuditLog } from '@/lib/audit/logger'

const publishSchema = z.object({
  sessionIds: z.array(z.string()).min(1).max(500),
})

/**
 * POST /api/staff/exams/internal/operations/publish
 * Publishes results for one or more completed exam sessions. Once
 * published, students can see their scores in their exam records.
 * Idempotent — sessions already published are skipped silently.
 */
export const POST = withErrorHandler(async (req: NextRequest) => {
  const staff = await requireStaff()

  const body = await req.json()
  const parsed = publishSchema.safeParse(body)
  if (!parsed.success) return apiError('Invalid input — provide an array of session IDs')

  const { sessionIds } = parsed.data

  // Only publish sessions that are COMPLETED or TIMED_OUT and not already
  // published. Snapshot the ids that will flip so we can audit-log them.
  const candidates = await prismaUnfiltered.internalExamSession.findMany({
    where: {
      id: { in: sessionIds },
      status: { in: ['COMPLETED', 'TIMED_OUT'] },
      isPublished: false,
    },
    select: { id: true, studentId: true, bankId: true, percentage: true, passed: true },
  })

  if (candidates.length === 0) {
    return apiSuccess({ published: 0 })
  }

  const result = await prismaUnfiltered.internalExamSession.updateMany({
    where: { id: { in: candidates.map((c) => c.id) } },
    data: { isPublished: true },
  })

  await createAuditLog({
    userId: staff.id,
    action: 'UPDATE',
    entity: 'InternalExamSession',
    entityId: candidates.length === 1 ? candidates[0].id : `batch:${result.count}`,
    description: `Published ${result.count} internal exam result${result.count === 1 ? '' : 's'}`,
    changes: {
      sessionIds: candidates.map((c) => c.id),
      before: { isPublished: false },
      after: { isPublished: true },
    },
  })

  return apiSuccess({ published: result.count })
})
