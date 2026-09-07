import { NextRequest } from 'next/server'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { z } from 'zod'
import { transitionApplication } from '@/lib/admissions/state-machine'

const schema = z.object({
  applicationIds: z.array(z.string()).min(1),
  action: z.enum(['SHORTLIST', 'REJECT']),
  reason: z.string().optional(),
})

export const POST = withErrorHandler(async (req: NextRequest) => {
  const staff = await requireStaff()
  const staffId = staff.id

  const body = await req.json()
  const result = schema.safeParse(body)

  if (!result.success) {
    return apiError('Invalid request body')
  }

  const { applicationIds, action, reason } = result.data

  const targetStage = action === 'SHORTLIST' ? 'SHORTLISTED' : 'REJECTED'

  let successCount = 0
  const failures: { id: string; error: string }[] = []

  for (const id of applicationIds) {
    try {
      const transition = await transitionApplication(id, targetStage, staffId, {
        rejectionReason: action === 'REJECT' ? reason : undefined,
      })
      if (transition.success) {
        successCount++
      } else {
        failures.push({ id, error: transition.error || 'Transition not allowed' })
      }
    } catch (err: unknown) {
      failures.push({ id, error: err instanceof Error ? err.message : 'Unknown error' })
    }
  }

  if (failures.length > 0 && successCount === 0) {
    return apiError(`Failed to process all applications: ${failures[0].error}`, 400, { failures })
  }

  return apiSuccess({
    processed: successCount,
    failed: failures.length,
    failures,
  })
})
