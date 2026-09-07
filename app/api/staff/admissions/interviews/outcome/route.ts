import { NextRequest } from 'next/server'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { transitionApplication } from '@/lib/admissions/state-machine'
import { z } from 'zod'

const schema = z.object({
  applicationId: z.string(),
  outcome: z.enum(['PASS', 'FAIL', 'CONDITIONAL', 'NO_SHOW']),
  score: z.number().min(0).max(100).optional(),
  notes: z.string().optional(),
})

export const POST = withErrorHandler(async (req: NextRequest) => {
  const staff = await requireStaff()
  const staffId = staff.id

  const body = await req.json()
  const result = schema.safeParse(body)
  if (!result.success) return apiError('Invalid input')

  const { applicationId, outcome, score, notes } = result.data

  const app = await prismaUnfiltered.application.findUnique({
    where: { id: applicationId },
  })

  if (!app) return apiError('Application not found', 404)

  if (outcome === 'NO_SHOW') {
    // Return to pending and clear slot
    await prismaUnfiltered.application.update({
      where: { id: applicationId },
      data: { interviewSlotId: null }
    })
    
    // Decrease booked count on the slot
    if (app.interviewSlotId) {
      await prismaUnfiltered.interviewSlot.update({
        where: { id: app.interviewSlotId },
        data: { bookedCount: { decrement: 1 } }
      })
    }

    await transitionApplication(applicationId, 'INTERVIEW_PENDING', staffId, {
      metadata: { notes, noShow: true }
    })
  } else {
    // First mark as completed if it's currently scheduled
    if (app.stage === 'INTERVIEW_SCHEDULED') {
      await transitionApplication(applicationId, 'INTERVIEW_COMPLETED', staffId, {
        metadata: { notes }
      })
    }

    // Then move to final outcome
    if (outcome === 'PASS' || outcome === 'CONDITIONAL') {
      await transitionApplication(applicationId, 'SELECTED', staffId, {
        metadata: { notes, score, isConditional: outcome === 'CONDITIONAL' }
      })
    } else {
      await transitionApplication(applicationId, 'REJECTED', staffId, {
        rejectionReason: notes || 'Interview failed'
      })
    }
    
    // Save notes and score to metadata
    const existingMeta = (app.metadata as Record<string, unknown> | null) ?? {}
    await prismaUnfiltered.application.update({
      where: { id: applicationId },
      data: {
        metadata: { 
          ...existingMeta, 
          interviewNotes: notes,
          interviewScore: score,
          interviewConditional: outcome === 'CONDITIONAL'
        }
      }
    })
  }

  return apiSuccess({ success: true })
})
