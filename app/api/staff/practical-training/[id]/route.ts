import { NextRequest } from 'next/server'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { prismaUnfiltered } from '@/lib/prisma/client'

// PUT — sign/update a practical training record (dual signature)
export const PUT = withErrorHandler(async (req: NextRequest, ctx: any) => {
  await requireStaff()
  const { id } = await ctx.params
  const body = await req.json()

  const record = await prismaUnfiltered.practicalTrainingRecord.findUnique({ where: { id } })
  if (!record) return apiError('Record not found', 404)

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
