import { NextRequest } from 'next/server'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { getAptitudeConfig } from '@/lib/settings'
import { requireAuth } from '@/lib/auth/helpers'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { z } from 'zod'

const eventSchema = z.object({
  sessionId: z.string().cuid(),
  eventType: z.enum(['TAB_SWITCH', 'FULLSCREEN_EXIT']),
})

// POST /api/applicant/aptitude/anti-cheat
export const POST = withErrorHandler(async (req: NextRequest) => {
  const user = await requireAuth()
  const body = await req.json()
  const parsed = eventSchema.safeParse(body)
  if (!parsed.success) return apiError(parsed.error.issues[0].message)

  const { sessionId, eventType } = parsed.data

  const session = await prismaUnfiltered.aptitudeTestSession.findUnique({
    where: { id: sessionId },
  })

  if (!session) return apiError('Session not found', 404)
  if (session.userId !== user.id) return apiError('Unauthorized', 403)
  if (session.status !== 'IN_PROGRESS') return apiSuccess({ ignored: true })

  // Get limits
  const config = await getAptitudeConfig()
  const maxViolations = config.aptitude_max_tab_switches

  let tabSwitchCount = session.tabSwitchCount
  let fullscreenExits = session.fullscreenExits

  if (eventType === 'TAB_SWITCH') tabSwitchCount++
  if (eventType === 'FULLSCREEN_EXIT') fullscreenExits++

  let status: 'IN_PROGRESS' | 'FLAGGED' = session.status

  if (tabSwitchCount + fullscreenExits > maxViolations) {
    status = 'FLAGGED'
  }

  await prismaUnfiltered.aptitudeTestSession.update({
    where: { id: sessionId },
    data: {
      tabSwitchCount,
      fullscreenExits,
      status,
    }
  })

  return apiSuccess({ status })
})
