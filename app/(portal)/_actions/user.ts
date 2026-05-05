'use server'

import { prismaUnfiltered } from '@/lib/prisma/client'
import { getAuthSession } from '@/lib/auth/helpers'
import { revalidatePath } from 'next/cache'

export async function markTourAsCompleted() {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' }
  }

  try {
    await prismaUnfiltered.user.update({
      where: { id: session.user.id },
      data: { hasCompletedTour: true },
    })
    revalidatePath('/')
    return { success: true }
  } catch (error) {
    console.error('[MARK_TOUR_COMPLETED]', error)
    return { success: false, error: 'Failed to update tour status' }
  }
}

export async function resetTourStatus() {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' }
  }

  try {
    await prismaUnfiltered.user.update({
      where: { id: session.user.id },
      data: { hasCompletedTour: false },
    })
    revalidatePath('/')
    return { success: true }
  } catch (error) {
    console.error('[RESET_TOUR_STATUS]', error)
    return { success: false, error: 'Failed to reset tour status' }
  }
}
