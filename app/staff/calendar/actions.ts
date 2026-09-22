'use server'

import { revalidatePath } from 'next/cache'
import { getAuthSession } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { CalendarAudience, RecurrenceType } from '@prisma/client'
import { AuditAction, logAuditEvent } from '@/lib/audit/logger'
import { z } from 'zod'

const recurrenceTypeSchema = z.enum(['NONE', 'DAILY', 'WEEKLY', 'MONTHLY'] as const)

function validateRecurrenceType(value: string): RecurrenceType {
  const result = recurrenceTypeSchema.safeParse(value)
  return result.success ? result.data : 'NONE'
}

export interface AdminEventInput {
  title: string
  description?: string
  startDate: string
  endDate?: string
  color?: string
  recurrenceType?: string
  recurrenceDays?: string
  recurrenceUntil?: string
  visibleTo: CalendarAudience
  classId?: string
  examEventId?: string
  targetUserId?: string
}

export async function createAdminCalendarEvent(data: AdminEventInput) {
  const session = await getAuthSession()
  if (!session || !['ADMIN', 'STAFF'].includes(session.user.role)) {
    return { error: 'Unauthorized' }
  }

  try {
    let resolvedTargetId: string | null = null

    if (data.visibleTo === 'SPECIFIC_USER' && data.targetUserId) {
      const u = await prismaUnfiltered.user.findFirst({
        where: {
          OR: [
            { id: data.targetUserId },
            { email: data.targetUserId },
            { academyEmail: data.targetUserId },
          ],
        },
      })
      if (!u) return { error: 'Target user not found' }
      resolvedTargetId = u.id
    } else if (data.visibleTo === 'SPECIFIC_USER') {
      return { error: 'Target user is required for specific user visibility' }
    }

    const event = await prismaUnfiltered.adminCalendarEvent.create({
      data: {
        title: data.title.trim(),
        description: data.description?.trim() || null,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        color: data.color || '#3b82f6',
        recurrenceType: validateRecurrenceType(data.recurrenceType || 'NONE'),
        recurrenceDays: data.recurrenceDays || null,
        recurrenceUntil: data.recurrenceUntil ? new Date(data.recurrenceUntil) : null,
        visibleTo: data.visibleTo,
        targetUserId: resolvedTargetId,
        classId: data.classId || null,
        examEventId: data.examEventId || null,
        createdBy: session.user.id,
      },
    })
    await logAuditEvent({
      userId: session.user.id,
      action: AuditAction.CREATE,
      entity: 'AdminCalendarEvent',
      entityId: event.id,
      description: `Created calendar event "${event.title}" for ${event.visibleTo}.`,
      changes: {
        title: event.title,
        startDate: event.startDate,
        endDate: event.endDate,
        visibleTo: event.visibleTo,
        targetUserId: event.targetUserId,
      },
    })
    revalidatePath('/staff/calendar')
    return { success: true, event }
  } catch (err) {
    console.error('[createAdminCalendarEvent]', err)
    return { error: 'Failed to create event' }
  }
}

export async function updateAdminCalendarEvent(id: string, data: AdminEventInput) {
  const session = await getAuthSession()
  if (!session || !['ADMIN', 'STAFF'].includes(session.user.role)) {
    return { error: 'Unauthorized' }
  }

  try {
    const existing = await prismaUnfiltered.adminCalendarEvent.findUnique({ where: { id } })
    if (!existing || existing.deletedAt) return { error: 'Event not found' }

    let resolvedTargetId: string | null = existing.targetUserId

    if (data.visibleTo === 'SPECIFIC_USER' && data.targetUserId) {
      const u = await prismaUnfiltered.user.findFirst({
        where: {
          OR: [
            { id: data.targetUserId },
            { email: data.targetUserId },
            { academyEmail: data.targetUserId },
          ],
        },
      })
      if (!u) return { error: 'Target user not found' }
      resolvedTargetId = u.id
    } else if (data.visibleTo === 'SPECIFIC_USER') {
      return { error: 'Target user is required for specific user visibility' }
    } else {
      resolvedTargetId = null
    }

    const event = await prismaUnfiltered.adminCalendarEvent.update({
      where: { id },
      data: {
        title: data.title.trim(),
        description: data.description?.trim() || null,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        color: data.color || '#3b82f6',
        recurrenceType: validateRecurrenceType(data.recurrenceType || 'NONE'),
        recurrenceDays: data.recurrenceDays || null,
        recurrenceUntil: data.recurrenceUntil ? new Date(data.recurrenceUntil) : null,
        visibleTo: data.visibleTo,
        targetUserId: resolvedTargetId,
        classId: data.classId || null,
        examEventId: data.examEventId || null,
      },
    })
    await logAuditEvent({
      userId: session.user.id,
      action: AuditAction.UPDATE,
      entity: 'AdminCalendarEvent',
      entityId: event.id,
      description: `Updated calendar event "${event.title}".`,
      changes: {
        before: {
          title: existing.title,
          startDate: existing.startDate,
          endDate: existing.endDate,
          visibleTo: existing.visibleTo,
          targetUserId: existing.targetUserId,
        },
        after: {
          title: event.title,
          startDate: event.startDate,
          endDate: event.endDate,
          visibleTo: event.visibleTo,
          targetUserId: event.targetUserId,
        },
      },
    })
    revalidatePath('/staff/calendar')
    return { success: true, event }
  } catch (err) {
    console.error('[updateAdminCalendarEvent]', err)
    return { error: 'Failed to update event' }
  }
}

export async function deleteAdminCalendarEvent(id: string) {
  const session = await getAuthSession()
  if (!session || !['ADMIN', 'STAFF'].includes(session.user.role)) {
    return { error: 'Unauthorized' }
  }

  try {
    const existing = await prismaUnfiltered.adminCalendarEvent.findUnique({ where: { id } })
    if (!existing || existing.deletedAt) return { error: 'Event not found' }

    await prismaUnfiltered.adminCalendarEvent.update({
      where: { id },
      data: { deletedAt: new Date() },
    })
    await logAuditEvent({
      userId: session.user.id,
      action: AuditAction.DELETE,
      entity: 'AdminCalendarEvent',
      entityId: id,
      description: `Deleted calendar event "${existing.title}".`,
      changes: {
        title: existing.title,
        startDate: existing.startDate,
        endDate: existing.endDate,
        visibleTo: existing.visibleTo,
      },
    })
    revalidatePath('/staff/calendar')
    return { success: true }
  } catch (err) {
    console.error('[deleteAdminCalendarEvent]', err)
    return { error: 'Failed to delete event' }
  }
}

export async function getClassesForDropdown() {
  const session = await getAuthSession()
  if (!session || !['ADMIN', 'STAFF'].includes(session.user.role)) {
    return []
  }
  return prismaUnfiltered.class.findMany({
    select: { id: true, name: true, course: { select: { code: true } } },
    orderBy: { startDate: 'desc' },
    take: 100,
  })
}

export async function getExamEventsForDropdown() {
  const session = await getAuthSession()
  if (!session || !['ADMIN', 'STAFF'].includes(session.user.role)) {
    return []
  }
  return prismaUnfiltered.examEvent.findMany({
    where: { deletedAt: null, status: { not: 'CANCELLED' } },
    select: { id: true, name: true, startDate: true },
    orderBy: { startDate: 'desc' },
    take: 100,
  })
}
