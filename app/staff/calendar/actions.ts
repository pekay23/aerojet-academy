'use server'

import { revalidatePath } from 'next/cache'
import { getAuthSession } from '@/lib/auth/helpers'
import prisma from '@/lib/prisma/client'
import { CalendarAudience, RecurrenceType } from '@prisma/client'

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
      const u = await prisma.user.findFirst({
        where: {
          OR: [
            { id: data.targetUserId },
            { email: data.targetUserId },
            { academyEmail: data.targetUserId }
          ]
        }
      })
      if (!u) return { error: 'Target user not found' }
      resolvedTargetId = u.id
    } else if (data.visibleTo === 'SPECIFIC_USER') {
      return { error: 'Target user is required for specific user visibility' }
    }

    const event = await prisma.adminCalendarEvent.create({
      data: {
        title: data.title.trim(),
        description: data.description?.trim() || null,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        color: data.color || '#3b82f6',
        recurrenceType: (data.recurrenceType as RecurrenceType) || 'NONE',
        recurrenceDays: data.recurrenceDays || null,
        recurrenceUntil: data.recurrenceUntil ? new Date(data.recurrenceUntil) : null,
        visibleTo: data.visibleTo,
        targetUserId: resolvedTargetId,
        classId: data.classId || null,
        examEventId: data.examEventId || null,
        createdBy: session.user.id,
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
    const existing = await prisma.adminCalendarEvent.findUnique({ where: { id } })
    if (!existing || existing.deletedAt) return { error: 'Event not found' }

    let resolvedTargetId: string | null = existing.targetUserId

    if (data.visibleTo === 'SPECIFIC_USER' && data.targetUserId) {
      const u = await prisma.user.findFirst({
        where: {
          OR: [
            { id: data.targetUserId },
            { email: data.targetUserId },
            { academyEmail: data.targetUserId }
          ]
        }
      })
      if (!u) return { error: 'Target user not found' }
      resolvedTargetId = u.id
    } else if (data.visibleTo === 'SPECIFIC_USER') {
      return { error: 'Target user is required for specific user visibility' }
    } else {
      resolvedTargetId = null
    }

    const event = await prisma.adminCalendarEvent.update({
      where: { id },
      data: {
        title: data.title.trim(),
        description: data.description?.trim() || null,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        color: data.color || '#3b82f6',
        recurrenceType: (data.recurrenceType as RecurrenceType) || 'NONE',
        recurrenceDays: data.recurrenceDays || null,
        recurrenceUntil: data.recurrenceUntil ? new Date(data.recurrenceUntil) : null,
        visibleTo: data.visibleTo,
        targetUserId: resolvedTargetId,
        classId: data.classId || null,
        examEventId: data.examEventId || null,
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
    await prisma.adminCalendarEvent.update({
      where: { id },
      data: { deletedAt: new Date() },
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
  return prisma.class.findMany({
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
  return prisma.examEvent.findMany({
    where: { deletedAt: null, status: { not: 'CANCELLED' } },
    select: { id: true, name: true, startDate: true },
    orderBy: { startDate: 'desc' },
    take: 100,
  })
}
