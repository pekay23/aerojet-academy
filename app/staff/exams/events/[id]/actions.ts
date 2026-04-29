'use server'

import { EventOverrideStatus } from '@prisma/client'
import { getAuthSession } from '@/lib/auth/helpers'
import { logAuditEvent } from '@/lib/audit/logger'
import { prisma } from '@/lib/prisma/client'
import { revalidatePath } from 'next/cache'

import { redistributeAutoPool } from '@/lib/pools/auto-pool'
import { scheduleEventSittings } from '@/lib/exams/scheduler'

export async function setEventOverride(eventId: string, status: EventOverrideStatus) {
  const session = await getAuthSession()
  if (!session) return { success: false, error: 'Unauthorized' }

  const oldEvent = await prisma.examEvent.findUnique({ where: { id: eventId } })

  await prisma.examEvent.update({
    where: { id: eventId },
    data: { overrideStatus: status },
  })

  // Log the audit event
  await logAuditEvent({
    userId: session.user.id,
    action: 'EVENT_OVERRIDE',
    entity: 'ExamEvent',
    entityId: eventId,
    description: `Staff set override status to ${status} (was ${oldEvent?.overrideStatus || 'NONE'})`,
    changes: { before: oldEvent?.overrideStatus, after: status },
  })

  revalidatePath(`/staff/exams/events/${eventId}`)
  return { success: true }
}

export async function triggerRedistribution(eventId: string) {
  const session = await getAuthSession()
  if (!session) return { success: false, error: 'Unauthorized' }

  try {
    const result = await redistributeAutoPool(eventId)
    revalidatePath(`/staff/exams/events/${eventId}`)
    return { 
      success: true, 
      message: `Redistributed ${result.redistributed} students. ${result.converted} overflow pool(s) created. ${result.confirmed} pool(s) confirmed.` 
    }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to redistribute auto pool' }
  }
}

export async function triggerSittingGeneration(eventId: string) {
  const session = await getAuthSession()
  if (!session) return { success: false, error: 'Unauthorized' }

  try {
    const result = await scheduleEventSittings(eventId, {
      preserveExistingAssignments: true,
      actorId: session.user.id,
    })

    await logAuditEvent({
      userId: session.user.id,
      action: 'GENERATE_SITTINGS',
      entity: 'ExamEvent',
      entityId: eventId,
      description: `Generated ${result.generatedSittings} sitting slot(s) for ${result.eventName}`,
      changes: {
        generatedSittings: result.generatedSittings,
        preservedAssignments: result.preservedAssignments,
      },
    })

    revalidatePath(`/staff/exams/events/${eventId}`)
    revalidatePath('/staff/exams')
    revalidatePath('/student/exams')

    return {
      success: true,
      message: `Generated ${result.generatedSittings} sitting slot(s). Preserved ${result.preservedAssignments} occupied slot(s).`,
    }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to generate sittings' }
  }
}
