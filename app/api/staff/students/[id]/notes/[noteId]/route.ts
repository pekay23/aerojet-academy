import { NextRequest } from 'next/server'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiError, apiNotFound, withErrorHandler } from '@/lib/api/response'
import { createAuditLog, AuditAction } from '@/lib/audit/logger'
import { softDeleteData } from '@/lib/prisma/soft-delete'

// PATCH /api/staff/students/[id]/notes/[noteId] — Update an admin note
export const PATCH = withErrorHandler(
  async (req: NextRequest, context?: { params: Record<string, string> }) => {
    const staff = await requireStaff()
    const id = context?.params?.id
    const noteId = context?.params?.noteId
    if (!id) return apiError('Student ID required')
    if (!noteId) return apiError('Note ID required')

    const body = await req.json()
    const { content } = body as { content?: string }

    if (!content || !content.trim()) {
      return apiError('Note content is required')
    }

    // Find student profile to verify note belongs to this student
    const student = await prismaUnfiltered.user.findUnique({
      where: { id },
      include: { studentProfile: true, profile: true },
    })

    if (!student || !student.studentProfile) {
      return apiNotFound('Student profile not found')
    }

    const note = await prismaUnfiltered.adminNote.findUnique({
      where: { id: noteId },
    })

    if (!note || note.studentProfileId !== student.studentProfile.id) {
      return apiNotFound('Note not found')
    }

    // Permission check: SUPER_ADMIN can edit any note; others can only edit their own
    if (staff.role !== 'SUPER_ADMIN' && note.createdBy !== staff.id) {
      return apiError('You can only edit your own notes', 403)
    }

    const updatedNote = await prismaUnfiltered.adminNote.update({
      where: { id: noteId },
      data: { content: content.trim() },
      include: {
        author: {
          select: {
            id: true,
            profile: { select: { firstName: true, lastName: true } },
          },
        },
      },
    })

    const studentName = student.profile
      ? `${student.profile.firstName} ${student.profile.lastName}`
      : student.email

    await createAuditLog({
      action: AuditAction.UPDATE,
      entity: 'AdminNote',
      entityId: noteId,
      userId: staff.id,
      description: `Updated admin note for student ${studentName}`,
      changes: {
        studentUserId: id,
        noteId,
        previousContent: note.content,
        newContent: content.trim(),
      },
    })

    const { author, ...rest } = updatedNote
    return apiSuccess({
      note: {
        ...rest,
        authorName: author.profile
          ? `${author.profile.firstName} ${author.profile.lastName}`
          : 'Staff',
      },
    })
  }
)

// DELETE /api/staff/students/[id]/notes/[noteId] — Delete an admin note
export const DELETE = withErrorHandler(
  async (req: NextRequest, context?: { params: Record<string, string> }) => {
    const staff = await requireStaff()
    const id = context?.params?.id
    const noteId = context?.params?.noteId
    if (!id) return apiError('Student ID required')
    if (!noteId) return apiError('Note ID required')

    // Find student profile to verify note belongs to this student
    const student = await prismaUnfiltered.user.findUnique({
      where: { id },
      include: { studentProfile: true, profile: true },
    })

    if (!student || !student.studentProfile) {
      return apiNotFound('Student profile not found')
    }

    const note = await prismaUnfiltered.adminNote.findUnique({
      where: { id: noteId },
    })

    if (!note || note.studentProfileId !== student.studentProfile.id) {
      return apiNotFound('Note not found')
    }

    // Permission check: SUPER_ADMIN can delete any note; others can only delete their own
    if (staff.role !== 'SUPER_ADMIN' && note.createdBy !== staff.id) {
      return apiError('You can only delete your own notes', 403)
    }

    await prismaUnfiltered.adminNote.update({
      where: { id: noteId },
      data: softDeleteData(),
    })

    const studentName = student.profile
      ? `${student.profile.firstName} ${student.profile.lastName}`
      : student.email

    await createAuditLog({
      action: AuditAction.DELETE,
      entity: 'AdminNote',
      entityId: noteId,
      userId: staff.id,
      description: `Deleted admin note for student ${studentName}`,
      changes: {
        studentUserId: id,
        noteId,
        deletedContent: note.content,
      },
    })

    return apiSuccess({ message: 'Note deleted' })
  }
)
