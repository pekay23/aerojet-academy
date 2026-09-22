'use server'

import { requireStaff } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { revalidatePath } from 'next/cache'
import { AuditAction, createAuditLog } from '@/lib/audit/logger'

export async function upsertATAChapter(data: {
  id?: string
  code: string
  title: string
  description?: string
  category: 'AIRFRAME' | 'POWERPLANT' | 'AVIONICS' | 'GENERAL'
  sortOrder: number
  isActive: boolean
}) {
  const staff = await requireStaff()

  try {
    let chapter
    if (data.id) {
      chapter = await prismaUnfiltered.aTAChapter.update({
        where: { id: data.id },
        data: {
          code: data.code,
          title: data.title,
          description: data.description,
          category: data.category,
          sortOrder: data.sortOrder,
          isActive: data.isActive,
        },
      })
    } else {
      chapter = await prismaUnfiltered.aTAChapter.create({
        data: {
          code: data.code,
          title: data.title,
          description: data.description,
          category: data.category,
          sortOrder: data.sortOrder,
          isActive: data.isActive,
        },
      })
    }

    await createAuditLog({
      action: data.id ? AuditAction.UPDATE : AuditAction.CREATE,
      entity: 'ATAChapter',
      entityId: chapter.id,
      userId: staff.id,
      description: data.id
        ? `Updated ATA Chapter ${chapter.code}`
        : `Created ATA Chapter ${chapter.code}`,
      changes: data,
    })

    revalidatePath('/staff/ata-chapters')
    return { success: true }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return { success: false, error: message }
  }
}

export async function toggleATAChapterStatus(id: string, isActive: boolean) {
  const staff = await requireStaff()

  try {
    const chapter = await prismaUnfiltered.aTAChapter.update({
      where: { id },
      data: { isActive },
    })

    await createAuditLog({
      action: AuditAction.UPDATE,
      entity: 'ATAChapter',
      entityId: id,
      userId: staff.id,
      description: `ATA Chapter ${chapter.code} ${isActive ? 'activated' : 'deactivated'}`,
      changes: { isActive },
    })

    revalidatePath('/staff/ata-chapters')
    return { success: true }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return { success: false, error: message }
  }
}
