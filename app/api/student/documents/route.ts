import { getAuthSession } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'

export const GET = withErrorHandler(async () => {
  const session = await getAuthSession()
  if (!session) return apiError('Unauthorized', 401)

  const documents = await prismaUnfiltered.studentDocument.findMany({
    where: { userId: session.user.id },
    orderBy: [{ type: 'asc' }, { createdAt: 'desc' }],
    select: {
      id: true,
      type: true,
      title: true,
      fileUrl: true,
      version: true,
      status: true,
      expiresAt: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  return apiSuccess(documents)
})
