'use server'

import { revalidatePath } from 'next/cache'
import { requireInstructor } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { buildStoragePath, getSignedUrl, uploadToStorage } from '@/lib/storage/supabase-storage'

/**
 * Audit 6b — instructor teaching-materials management. Materials are scoped to
 * the signed-in instructor; courseId/classId are stored as plain references.
 */

export async function addTeachingMaterial(input: {
  title: string
  description?: string
  fileUrl?: string
  courseId?: string
  classId?: string
  visibility?: 'CLASS' | 'COURSE' | 'ALL_STUDENTS'
}) {
  try {
    const user = await requireInstructor()
    if (!input.title?.trim()) return { error: 'A title is required.' }
    if (!input.fileUrl?.trim()) return { error: 'A file URL is required.' }
    await prismaUnfiltered.teachingMaterial.create({
      data: {
        uploadedById: user.id,
        title: input.title.trim(),
        description: input.description?.trim() || null,
        fileUrl: input.fileUrl.trim(),
        fileType: null,
        courseId: input.courseId || null,
        classId: input.classId || null,
        visibility: input.visibility ?? 'CLASS',
      },
    })
    revalidatePath('/instructor/materials')
    return { success: true }
  } catch (e) {
    console.error('[addTeachingMaterial]', e)
    return { error: 'Failed to add material.' }
  }
}

export async function uploadTeachingMaterial(formData: FormData) {
  try {
    const user = await requireInstructor()
    const title = String(formData.get('title') ?? '').trim()
    const courseId = String(formData.get('courseId') ?? '').trim()
    const visibility = (String(formData.get('visibility') ?? 'CLASS') || 'CLASS') as
      | 'CLASS'
      | 'COURSE'
      | 'ALL_STUDENTS'
    const file = formData.get('file')
    if (!title) return { error: 'A title is required.' }
    if (!(file instanceof File) || file.size === 0) return { error: 'A file is required.' }

    const path = buildStoragePath({
      scope: 'resources',
      ownerId: courseId || user.id,
      category: 'teaching-materials',
      fileName: file.name,
    })
    const bytes = Buffer.from(await file.arrayBuffer())
    await uploadToStorage(path, bytes, file.type || 'application/octet-stream')
    const signedUrl = await getSignedUrl(path, 60 * 60 * 24 * 365)

    await prismaUnfiltered.teachingMaterial.create({
      data: {
        uploadedById: user.id,
        title,
        fileUrl: signedUrl ?? path,
        fileType: file.type || null,
        courseId: courseId || null,
        visibility,
      },
    })
    revalidatePath('/instructor/materials')
    return { success: true }
  } catch (e) {
    console.error('[uploadTeachingMaterial]', e)
    return { error: e instanceof Error ? e.message : 'Failed to upload material.' }
  }
}

export async function deleteTeachingMaterial(id: string) {
  try {
    const user = await requireInstructor()
    const m = await prismaUnfiltered.teachingMaterial.findUnique({ where: { id } })
    if (!m || m.uploadedById !== user.id) return { error: 'Not found.' }
    await prismaUnfiltered.teachingMaterial.delete({ where: { id } })
    revalidatePath('/instructor/materials')
    return { success: true }
  } catch (e) {
    console.error('[deleteTeachingMaterial]', e)
    return { error: 'Failed to delete material.' }
  }
}
