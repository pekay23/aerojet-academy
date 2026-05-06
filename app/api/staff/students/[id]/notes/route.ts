import { NextRequest } from 'next/server'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiError, apiNotFound, withErrorHandler } from '@/lib/api/response'
import { createAuditLog, AuditAction } from '@/lib/audit/logger'

// GET /api/staff/students/[id]/notes — List all admin notes for a student
export const GET = withErrorHandler(
  async (req: NextRequest, context?: { params: Record<string, string> }) => {
    await requireStaff()
    const id = context?.params?.id
    if (!id) return apiError('Student ID required')

    // Find student profile
    const student = await prismaUnfiltered.user.findUnique({
      where: { id },
      include: { studentProfile: true },
    })

    if (!student || !student.studentProfile) {
      return apiNotFound('Student profile not found')
    }

    const notes = await prismaUnfiltered.adminNote.findMany({
      where: { studentProfileId: student.studentProfile.id },
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: {
            id: true,
            profile: { select: { firstName: true, lastName: true } },
          },
        },
      },
    })

    // Enrich notes with author name
    const enrichedNotes = notes.map((note) => {
      const { author, ...rest } = note
      return {
        ...rest,
        authorName: author.profile
          ? `${author.profile.firstName} ${author.profile.lastName}`
          : 'Staff',
      }
    })

    return apiSuccess({ notes: enrichedNotes })
  }
)

// POST /api/staff/students/[id]/notes — Create a new admin note
export const POST = withErrorHandler(
  async (req: NextRequest, context?: { params: Record<string, string> }) => {
    const staff = await requireStaff()
    const id = context?.params?.id
    if (!id) return apiError('Student ID required')

    const body = await req.json()
    const { content } = body as { content?: string }

    if (!content || !content.trim()) {
      return apiError('Note content is required')
    }

    // Find student profile
    const student = await prismaUnfiltered.user.findUnique({
      where: { id },
      include: { studentProfile: true, profile: true },
    })

    if (!student || !student.studentProfile) {
      return apiNotFound('Student profile not found')
    }

    const note = await prismaUnfiltered.adminNote.create({
      data: {
        studentProfileId: student.studentProfile.id,
        content: content.trim(),
        createdBy: staff.id,
      },
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
      action: AuditAction.CREATE,
      entity: 'AdminNote',
      entityId: note.id,
      userId: staff.id,
      description: `Created admin note for student ${studentName}`,
      changes: {
        studentUserId: id,
        studentProfileId: student.studentProfile.id,
        noteId: note.id,
      },
    })

    const { author, ...rest } = note
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
