'use server'

import { requireAdmin } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { revalidatePath } from 'next/cache'
import { AuditAction, createAuditLog } from '@/lib/audit/logger'
import { handleActionError } from '@/lib/staff/errors'
import { getRequestContext } from '@/lib/server/request-context'

export async function setCertificateRelease(
  studentUserId: string,
  data: { certificatesReleased?: boolean; documentsReleased?: boolean; overrideJustification?: string }
) {
  try {
    const admin = await requireAdmin()

    const profile = await prismaUnfiltered.studentProfile.findUnique({
      where: { userId: studentUserId },
      select: { id: true, certificatesReleased: true, documentsReleased: true },
    })
    if (!profile) return { error: 'Student profile not found.' }

    if (data.certificatesReleased === true || data.documentsReleased === true) {
      if (!data.overrideJustification?.trim()) {
        return { error: 'Override justification is required for certificate/document release.' }
      }
    }

    const now = new Date()
    const update: Record<string, unknown> = {}
    if (typeof data.certificatesReleased === 'boolean') {
      update.certificatesReleased = data.certificatesReleased
      update.certificatesReleasedAt = data.certificatesReleased ? now : null
      update.certificatesReleasedBy = data.certificatesReleased ? admin.id : null
    }
    if (typeof data.documentsReleased === 'boolean') {
      update.documentsReleased = data.documentsReleased
      update.documentsReleasedAt = data.documentsReleased ? now : null
      update.documentsReleasedBy = data.documentsReleased ? admin.id : null
    }
    if (Object.keys(update).length === 0) return { error: 'Nothing to update.' }

    await prismaUnfiltered.studentProfile.update({
      where: { id: profile.id },
      data: update,
    })

    const ctx = await getRequestContext()
    await createAuditLog({
      action: AuditAction.UPDATE,
      entity: 'StudentProfile',
      entityId: profile.id,
      userId: admin.id,
      description: `Admin override for certificate/document release for student ${studentUserId}.${data.overrideJustification ? ` Justification: ${data.overrideJustification}` : ''}`,
      changes: { studentUserId, ...data },
      ipAddress: ctx.ipAddress ?? undefined,
      userAgent: ctx.userAgent ?? undefined,
    })

    revalidatePath(`/staff/students/${studentUserId}`)
    revalidatePath('/student/certificates')
    return { success: true }
  } catch (error) {
    return { error: handleActionError('setCertificateRelease', error, 'Failed to update certificate release settings.') }
  }
}
