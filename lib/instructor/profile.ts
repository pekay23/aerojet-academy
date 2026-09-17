import 'server-only'

import { unstable_cache } from 'next/cache'
import { prismaUnfiltered } from '@/lib/prisma/client'

export const getInstructorProfileByUserId = (userId: string) =>
  unstable_cache(
    async () =>
      prismaUnfiltered.instructorProfile.findUnique({
        where: { userId },
      }),
    ['instructor-profile-by-user', userId],
    { tags: [`instructor-profile:${userId}`], revalidate: 300 }
  )()

export async function getInstructorProfileIdOrThrow(userId: string) {
  const profile = await getInstructorProfileByUserId(userId)
  if (!profile) {
    throw new Error('Instructor profile not found')
  }

  return profile.id
}