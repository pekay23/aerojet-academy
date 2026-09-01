import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { requireStudent } from '@/lib/auth/helpers'
import { apiSuccess, apiNotFound, apiError, withErrorHandler } from '@/lib/api/response'

export const GET = withErrorHandler(
  async (req: NextRequest, ctx?: { params: Record<string, string> }) => {
    const user = await requireStudent()
    const courseId = ctx?.params?.id
    if (!courseId) return apiError('Course ID required')

    // Verify enrollment
    const enrollment = await prismaUnfiltered.enrollment.findFirst({
      where: { userId: user.id, courseId },
    })
    if (!enrollment || enrollment.status === 'PENDING')
      return apiNotFound('Not enrolled in this course')

    const materials = await prismaUnfiltered.fileUpload.findMany({
      where: {
        referenceType: 'COURSE_MATERIAL',
        referenceId: courseId,
      },
      orderBy: { createdAt: 'desc' },
    })
    return apiSuccess(materials)
  }
)
