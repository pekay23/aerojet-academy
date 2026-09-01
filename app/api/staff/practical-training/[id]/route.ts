import { NextRequest } from 'next/server'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { prismaUnfiltered } from '@/lib/prisma/client'

// PUT — sign/update a practical training record (dual signature or full admin edit)
export const PUT = withErrorHandler(async (req: NextRequest, ctx: any) => {
  await requireStaff()
  const { id } = ctx.params
  const body = await req.json()

  const record = await prismaUnfiltered.practicalTrainingRecord.findUnique({ where: { id } })
  if (!record) return apiError('Record not found', 404)

  // Handle full admin edit payload if provided
  if (body.isFullEdit) {
    const updated = await prismaUnfiltered.practicalTrainingRecord.update({
      where: { id },
      data: {
        studentProfileId: body.studentProfileId,
        courseId: body.courseId,
        classId: body.classId || null,
        taskCategory: body.taskCategory,
        taskReference: body.taskReference || null,
        ataChapterId: body.ataChapterId || null,
        description: body.description,
        deliveryMethod: body.deliveryMethod,
        date: new Date(body.date),
        durationMinutes: Number(body.durationMinutes),
        instructorId: body.instructorId,
        result: body.result || null,
        assessorNotes: body.assessorNotes || null,
      },
    })
    return apiSuccess(updated)
  }

  // Otherwise fallback to the signature/quick-result update path
  const data: any = {}

  // Instructor signature
  if (body.signedByInstructor !== undefined) {
    data.signedByInstructor = body.signedByInstructor
  }

  // Assessment result
  if (body.result) {
    data.result = body.result
    data.assessorNotes = body.assessorNotes || null
    data.assessorId = body.assessorId || null
  }

  // Track signature timestamp
  if (body.signedByInstructor || body.signedByStudent) {
    data.signedAt = new Date()
  }

  // Student signature (can come from student portal too)
  if (body.signedByStudent !== undefined) {
    data.signedByStudent = body.signedByStudent
  }

  const updated = await prismaUnfiltered.practicalTrainingRecord.update({
    where: { id },
    data,
  })

  return apiSuccess(updated)
})

// DELETE — delete practical training record
export const DELETE = withErrorHandler(async (req: NextRequest, ctx: any) => {
  await requireStaff()
  const { id } = await ctx.params

  const record = await prismaUnfiltered.practicalTrainingRecord.findUnique({ where: { id } })
  if (!record) return apiError('Record not found', 404)

  await prismaUnfiltered.practicalTrainingRecord.delete({
    where: { id },
  })

  return apiSuccess({ message: 'Practical training record deleted successfully' })
})
