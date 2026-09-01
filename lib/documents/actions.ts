'use server'

import { revalidatePath } from 'next/cache'
import { requireStaff } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { AuditAction, createAuditLog } from '@/lib/audit/logger'
import { trackDocumentUpload } from '@/lib/analytics/events'
import {
  buildStoragePath,
  documentCategoryFolder,
  getSignedUrl,
  uploadToStorage,
} from '@/lib/storage/supabase-storage'

/**
 * Audit 15b — centralized student document vault with versioning + expiry.
 * Primary storage is UploadThing; Supabase storage buckets are recorded as a
 * fallback provider (storageProvider = SUPABASE) when UploadThing is unsuitable.
 */

export async function addStudentDocument(input: {
  student: string
  type: string
  title: string
  fileUrl: string
  storageProvider?: 'UPLOADTHING' | 'SUPABASE'
  expiresAt?: string | null
  supersedesId?: string | null
}) {
  try {
    const staff = await requireStaff()
    if (
      !input.student?.trim() ||
      !input.type?.trim() ||
      !input.title?.trim() ||
      !input.fileUrl?.trim()
    ) {
      return { error: 'Student, type, title and file URL are all required.' }
    }
    const q = input.student.trim()
    const target = await prismaUnfiltered.user.findFirst({
      where: {
        OR: [{ id: q }, { email: q }, { academyEmail: q }, { studentProfile: { studentId: q } }],
      },
      select: { id: true },
    })
    if (!target) return { error: 'No student found for that email / ID.' }

    let version = 1
    if (input.supersedesId) {
      const prev = await prismaUnfiltered.studentDocument.findUnique({
        where: { id: input.supersedesId },
        select: { version: true },
      })
      version = (prev?.version ?? 1) + 1
      await prismaUnfiltered.studentDocument.update({
        where: { id: input.supersedesId },
        data: { status: 'ARCHIVED' },
      })
    }

    const doc = await prismaUnfiltered.studentDocument.create({
      data: {
        userId: target.id,
        type: input.type.trim(),
        title: input.title.trim(),
        fileUrl: input.fileUrl.trim(),
        storageProvider: input.storageProvider ?? 'UPLOADTHING',
        version,
        supersedesId: input.supersedesId || null,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
        uploadedById: staff.id,
        status: 'ACTIVE',
      },
    })
    await createAuditLog({
      action: AuditAction.CREATE,
      entity: 'StudentDocument',
      entityId: doc.id,
      userId: staff.id,
      description: `Added document "${doc.title}" for ${target.id}.`,
    })
    revalidatePath('/staff/documents')
    revalidatePath('/student/documents')
    return { success: true }
  } catch (e) {
    console.error('[addStudentDocument]', e)
    return { error: 'Failed to add document.' }
  }
}

/**
 * Audit 15b — direct upload into the organized Supabase documents bucket
 * (fallback / unified store when UploadThing is unsuitable). Files land under
 * students/{studentId}/{category}/… and a signed URL is recorded.
 */
export async function uploadStudentDocumentFile(formData: FormData) {
  try {
    const staff = await requireStaff()
    const studentQuery = String(formData.get('student') ?? '').trim()
    const type = String(formData.get('type') ?? '').trim()
    const title = String(formData.get('title') ?? '').trim()
    const expiresAt = String(formData.get('expiresAt') ?? '').trim()
    const files = [...formData.getAll('files'), formData.get('file')].filter(
      (file): file is File => file instanceof File && file.size > 0
    )

    if (!studentQuery || !type || !title) {
      return { error: 'Student, type and title are required.' }
    }
    if (files.length === 0) {
      return { error: 'At least one file is required.' }
    }

    const target = await prismaUnfiltered.user.findFirst({
      where: {
        OR: [
          { id: studentQuery },
          { email: studentQuery },
          { academyEmail: studentQuery },
          { studentProfile: { studentId: studentQuery } },
        ],
      },
      select: { id: true, studentProfile: { select: { studentId: true } } },
    })
    if (!target) return { error: 'No student found for that email / ID.' }

    const ownerId = target.studentProfile?.studentId ?? target.id
    let uploadedCount = 0

    for (const [index, file] of files.entries()) {
      const path = buildStoragePath({
        scope: 'students',
        ownerId,
        category: documentCategoryFolder(type),
        fileName: `${index + 1}-${file.name}`,
      })
      const bytes = Buffer.from(await file.arrayBuffer())
      await uploadToStorage(path, bytes, file.type || 'application/octet-stream')
      const signedUrl = await getSignedUrl(path, 60 * 60 * 24 * 365)
      const docTitle = files.length === 1 ? title : `${title} - ${file.name}`

      const doc = await prismaUnfiltered.studentDocument.create({
        data: {
          userId: target.id,
          type,
          title: docTitle,
          fileUrl: signedUrl ?? path,
          storageProvider: 'SUPABASE',
          version: 1,
          expiresAt: expiresAt ? new Date(expiresAt) : null,
          uploadedById: staff.id,
          status: 'ACTIVE',
        },
      })
      trackDocumentUpload('staff_document', file.name, staff.id).catch(() => {})
      uploadedCount += 1
      await createAuditLog({
        action: AuditAction.CREATE,
        entity: 'StudentDocument',
        entityId: doc.id,
        userId: staff.id,
        description: `Uploaded "${docTitle}" to Supabase storage (${path}).`,
      })
    }
    revalidatePath('/staff/documents')
    revalidatePath('/student/documents')
    return { success: true, count: uploadedCount }
  } catch (e) {
    console.error('[uploadStudentDocumentFile]', e)
    return {
      error: e instanceof Error ? e.message : 'Failed to upload document to storage.',
    }
  }
}

export async function archiveStudentDocument(id: string) {
  try {
    const staff = await requireStaff()
    await prismaUnfiltered.studentDocument.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    })
    await createAuditLog({
      action: AuditAction.UPDATE,
      entity: 'StudentDocument',
      entityId: id,
      userId: staff.id,
      description: 'Archived student document.',
    })
    revalidatePath('/staff/documents')
    revalidatePath('/student/documents')
    return { success: true }
  } catch (e) {
    console.error('[archiveStudentDocument]', e)
    return { error: 'Failed to archive document.' }
  }
}
