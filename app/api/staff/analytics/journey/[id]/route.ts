import { NextRequest } from 'next/server'
import { withErrorHandler, apiError, apiSuccess } from '@/lib/api/response'
import { requireStaff } from '@/lib/auth/helpers'
import { getUserJourney } from '@/lib/analytics/queries'
import { prismaUnfiltered } from '@/lib/prisma/client'

export const GET = withErrorHandler(async (req: NextRequest, ctx: any) => {
  await requireStaff()
  const userId = ctx?.params?.id

  if (!userId) {
    return apiError('User ID is required', 400)
  }

  const [events, user] = await Promise.all([
    getUserJourney(userId),
    prismaUnfiltered.user.findUnique({
      where: { id: userId, deletedAt: null },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        lastSeenAt: true,
        profile: {
          select: {
            firstName: true,
            lastName: true,
            profilePhotoUrl: true,
          },
        },
        studentProfile: {
          select: {
            studentId: true,
          },
        },
      },
    }),
  ])

  if (!user) {
    return apiError('User not found', 404)
  }

  return apiSuccess({
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      lastSeenAt: user.lastSeenAt,
      firstName: user.profile?.firstName,
      lastName: user.profile?.lastName,
      avatarUrl: user.profile?.profilePhotoUrl,
      studentId: user.studentProfile?.studentId,
    },
    events,
  })
})
