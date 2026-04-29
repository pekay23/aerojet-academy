import prisma from '@/lib/prisma/client'

export async function getInstructorProfileByUserId(userId: string) {
  return prisma.instructorProfile.findUnique({
    where: { userId },
  })
}

export async function getInstructorProfileIdOrThrow(userId: string) {
  const profile = await getInstructorProfileByUserId(userId)
  if (!profile) {
    throw new Error('Instructor profile not found')
  }

  return profile.id
}
