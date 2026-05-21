import { NextRequest } from 'next/server'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { z } from 'zod'

const publishSchema = z.object({
  sessionIds: z.array(z.string()).min(1),
})

/**
 * POST /api/staff/exams/internal/operations/publish
 * Publishes results for one or more completed exam sessions.
 * Once published, students can see their scores in their exam records.
 */
export const POST = withErrorHandler(async (req: NextRequest, _ctx: any) => {
  await requireStaff()

  const body = await req.json()
  const parsed = publishSchema.safeParse(body)
  if (!parsed.success) return apiError('Invalid input — provide an array of session IDs')

  const { sessionIds } = parsed.data

  // Only publish sessions that are COMPLETED or TIMED_OUT and not already published
  const result = await prismaUnfiltered.internalExamSession.updateMany({
    where: {
      id: { in: sessionIds },
      status: { in: ['COMPLETED', 'TIMED_OUT'] },
      isPublished: false,
    },
    data: {
      isPublished: true,
    },
  })

  return apiSuccess({ published: result.count })
})
