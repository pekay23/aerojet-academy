'use server'

import { requireStaff } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { revalidatePath } from 'next/cache'

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
    if (data.id) {
      await prismaUnfiltered.aTAChapter.update({
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
      await prismaUnfiltered.aTAChapter.create({
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

    revalidatePath('/staff/ata-chapters')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function toggleATAChapterStatus(id: string, isActive: boolean) {
  const staff = await requireStaff()

  try {
    await prismaUnfiltered.aTAChapter.update({
      where: { id },
      data: { isActive },
    })

    revalidatePath('/staff/ata-chapters')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
