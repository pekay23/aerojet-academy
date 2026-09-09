'use server'

import { revalidatePath } from 'next/cache'
import { requireInstructor } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { buildStoragePath, getSignedUrl, uploadToStorage } from '@/lib/storage/supabase-storage'
import { createAuditLog } from '@/lib/audit/logger'

/**
 * Audit 6b — instructor teaching-materials management. Materials are scoped to
 * the signed-in instructor; courseId/classId are stored as plain references.
 */

export interface TeachingMaterialData {
  id: string
  title: string
  description: string | null
  fileUrl: string
  fileType: string | null
  visibility: string
  courseId: string | null
  classId: string | null
  createdAt: string
  course?: { id: string; code: string; name: string } | null
  class?: { id: string; name: string } | null
}

export interface CourseOption {
  id: string
  code: string
  name: string
}

export interface ClassOption {
  id: string
  name: string
  courseId: string
  course: { code: string; name: string }
}

export interface TeachingMaterialData {
  id: string
  title: string
  description: string | null
  fileUrl: string
  fileType: string | null
  visibility: string
  courseId: string | null
  classId: string | null
  createdAt: string
  course?: { id: string; code: string; name: string } | null
  class?: { id: string; name: string } | null
}

export interface CourseOption {
  id: string
  code: string
  name: string
}

export interface ClassOption {
  id: string
  name: string
  courseId: string
  course: { code: string; name: string }
}

export async function getInstructorMaterials() {
  const user = await requireInstructor()
  const materials = await prismaUnfiltered.teachingMaterial.findMany({
    where: { uploadedById: user.id },
    orderBy: { createdAt: 'desc' },
  })

  // Enrich with course/class data (courseId/classId are scalar FK fields, not Prisma relations)
  const courseIds = materials.filter((m) => m.courseId).map((m) => m.courseId as string)
  const classIds = materials.filter((m) => m.classId).map((m) => m.classId as string)

  const [courses, classes] = await Promise.all([
    courseIds.length > 0
      ? prismaUnfiltered.course.findMany({
          where: { id: { in: courseIds } },
          select: { id: true, code: true, name: true },
        })
      : [],
    classIds.length > 0
      ? prismaUnfiltered.class.findMany({
          where: { id: { in: classIds } },
          select: { id: true, name: true },
        })
      : [],
  ])

  const courseMap = new Map(courses.map((c) => [c.id, c]))
  const classMap = new Map(classes.map((c) => [c.id, c]))

  return materials.map((m) => ({
    ...m,
    course: m.courseId ? courseMap.get(m.courseId) || null : null,
    class: m.classId ? classMap.get(m.classId) || null : null,
  }))
}

export async function getInstructorCourseAndClassOptions() {
  const user = await requireInstructor()
  const instructorProfile = await prismaUnfiltered.instructorProfile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  })
  if (!instructorProfile) return { courses: [], classes: [] }

  const [courses, classes] = await Promise.all([
    prismaUnfiltered.course.findMany({
      where: { classes: { some: { instructorId: instructorProfile.id } } },
      select: { id: true, code: true, name: true },
      orderBy: { code: 'asc' },
    }),
    prismaUnfiltered.class.findMany({
      where: { instructorId: instructorProfile.id },
      include: { course: { select: { id: true, code: true, name: true } } },
      orderBy: { name: 'asc' },
    }),
  ])

  return { courses, classes }
}

export async function addTeachingMaterial(input: {
  title: string
  description?: string
  fileUrl?: string
  courseId?: string
  classId?: string
  visibility?: 'CLASS' | 'COURSE' | 'ALL_STUDENTS'
}) {
  const user = await requireInstructor()
  try {
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
    createAuditLog({
      action: 'TEACHING_MATERIAL_ADD_FAILED',
      userId: user.id,
      description: 'Failed to add teaching material',
      changes: { error: e instanceof Error ? e.message : String(e) },
    })
    return { error: 'Failed to add material.' }
  }
}

export async function uploadTeachingMaterial(formData: FormData) {
  const user = await requireInstructor()
  try {
    const title = String(formData.get('title') ?? '').trim()
    const courseId = String(formData.get('courseId') ?? '').trim()
    const classId = String(formData.get('classId') ?? '').trim()
    const visibility = (String(formData.get('visibility') ?? 'CLASS') || 'CLASS') as
      'CLASS' | 'COURSE' | 'ALL_STUDENTS'
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

    // Try signed URL first; fall back to public URL; fall back to raw path
    const signedUrl = await getSignedUrl(path, 60 * 60 * 24 * 365)
    const fileUrl = signedUrl || path

    await prismaUnfiltered.teachingMaterial.create({
      data: {
        uploadedById: user.id,
        title,
        fileUrl,
        fileType: file.type || null,
        courseId: courseId || null,
        classId: classId || null,
        visibility,
      },
    })
    revalidatePath('/instructor/materials')
    return { success: true }
  } catch (e) {
    createAuditLog({
      action: 'TEACHING_MATERIAL_UPLOAD_FAILED',
      userId: user.id,
      description: 'Failed to upload teaching material',
      changes: { error: e instanceof Error ? e.message : String(e) },
    })
    return { error: e instanceof Error ? e.message : 'Failed to upload material.' }
  }
}

export async function deleteTeachingMaterial(id: string) {
  const user = await requireInstructor()
  try {
    const m = await prismaUnfiltered.teachingMaterial.findUnique({ where: { id } })
    if (!m || m.uploadedById !== user.id) return { error: 'Not found.' }
    await prismaUnfiltered.teachingMaterial.delete({ where: { id } })
    revalidatePath('/instructor/materials')
    return { success: true }
  } catch (e) {
    createAuditLog({
      action: 'TEACHING_MATERIAL_DELETE_FAILED',
      userId: user.id,
      description: 'Failed to delete teaching material',
      changes: { materialId: id, error: e instanceof Error ? e.message : String(e) },
    })
    return { error: 'Failed to delete material.' }
  }
}
