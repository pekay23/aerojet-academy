'use server'

import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'

/**
 * Audit 6c / 7b — instructor & examiner self-service availability.
 * Slots belong to the signed-in user (instructor or examiner).
 */

export async function addAvailabilitySlot(input: {
  kind: 'RECURRING_WEEKLY' | 'SPECIFIC_DATE'
  dayOfWeek?: number | null
  date?: string | null
  startTime: string
  endTime: string
  available: boolean
  notes?: string
}) {
  try {
    const user = await requireAuth()
    if (!['INSTRUCTOR', 'EXAMINER'].includes(user.role)) {
      return { error: 'Only instructors and examiners can set availability.' }
    }
    if (!input.startTime || !input.endTime) return { error: 'Start and end time are required.' }
    if (input.kind === 'RECURRING_WEEKLY' && (input.dayOfWeek == null || input.dayOfWeek < 0)) {
      return { error: 'Select a day of week.' }
    }
    if (input.kind === 'SPECIFIC_DATE' && !input.date) return { error: 'Select a date.' }

    await prismaUnfiltered.staffAvailability.create({
      data: {
        userId: user.id,
        kind: input.kind,
        dayOfWeek: input.kind === 'RECURRING_WEEKLY' ? input.dayOfWeek! : null,
        date: input.kind === 'SPECIFIC_DATE' ? new Date(input.date!) : null,
        startTime: input.startTime,
        endTime: input.endTime,
        available: input.available,
        notes: input.notes?.trim() || null,
      },
    })
    revalidatePath('/instructor/availability')
    revalidatePath('/examiner/availability')
    return { success: true }
  } catch (e) {
    console.error('[addAvailabilitySlot]', e)
    return { error: 'Failed to add availability.' }
  }
}

export async function deleteAvailabilitySlot(id: string) {
  try {
    const user = await requireAuth()
    const slot = await prismaUnfiltered.staffAvailability.findUnique({ where: { id } })
    if (!slot || slot.userId !== user.id) return { error: 'Not found.' }
    await prismaUnfiltered.staffAvailability.delete({ where: { id } })
    revalidatePath('/instructor/availability')
    revalidatePath('/examiner/availability')
    return { success: true }
  } catch (e) {
    console.error('[deleteAvailabilitySlot]', e)
    return { error: 'Failed to remove availability.' }
  }
}
