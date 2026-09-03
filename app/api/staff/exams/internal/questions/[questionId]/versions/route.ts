import { NextRequest } from 'next/server'
import { getAuthSession } from '@/lib/auth/helpers'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { isInternalExamSystemEnabled } from '@/lib/internal-exam/engine'

export const GET = withErrorHandler(
  async (req: NextRequest, ctx: { params: Promise<{ questionId: string }> }) => {
    const session = await getAuthSession()
    if (
      !session ||
      !['ADMIN', 'SUPER_ADMIN', 'STAFF', 'EXAMINER', 'INSTRUCTOR'].includes(session.user.role)
    ) {
      return apiError('Unauthorized', 403)
    }
    if (!(await isInternalExamSystemEnabled())) {
      return apiError('Internal exams are not currently available', 403)
    }
    const { questionId } = await ctx.params

    const questionExists = await prismaUnfiltered.internalExamQuestion.findUnique({
      where: { id: questionId },
      select: { id: true },
    })

    if (!questionExists) {
      return apiError('Question not found', 404)
    }

    const versions = await prismaUnfiltered.internalExamQuestionVersion.findMany({
      where: { questionId },
      orderBy: { changedAt: 'desc' },
    })

    return apiSuccess(versions)
  }
)
