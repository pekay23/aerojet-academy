import prisma from '@/lib/prisma/client'

/**
 * Asserts that a user is on the EXAM_ONLY pathway and therefore
 * eligible to book exams. Throws if the user is not EXAM_ONLY.
 */
export async function assertExamOnlyPathway(userId: string): Promise<void> {
  const profile = await prisma.studentProfile.findUnique({
    where: { userId },
    select: {
      enrollmentType: true,
      pathwayRel: { select: { code: true } },
    },
  })

  if (!profile) {
    throw new Error('Student profile not found. Cannot book exams.')
  }

  const pathwayCode = profile.pathwayRel?.code
  const enrollmentType = profile.enrollmentType

  if (pathwayCode === 'EXAM_ONLY' || enrollmentType === 'EXAM_ONLY') {
    return
  }

  throw new Error(
    'Only Exam-Only pathway students can book exams. Please contact support if you believe this is an error.'
  )
}
