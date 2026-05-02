import prisma from '@/lib/prisma/client'
import { getDeduplicatedModulesForStudent } from './deduplication'

/**
 * Triggers auto-enrollment for a student by their StudentProfile ID, if their pathway requires it.
 * Call this AFTER a transaction commits (not inside $transaction).
 */
export async function triggerAutoEnrollmentIfRequired(studentProfileId: string): Promise<void> {
  const profile = await prisma.studentProfile.findUnique({
    where: { id: studentProfileId },
    select: { pathwayRel: { select: { requiresAutoEnrollment: true } } },
  })
  if (profile?.pathwayRel?.requiresAutoEnrollment) {
    await autoEnrollStudent(studentProfileId).catch(console.error)
  }
}

/**
 * Triggers auto-enrollment for a student by their User ID, if their pathway requires it.
 * Call this AFTER a transaction commits (not inside $transaction).
 */
export async function triggerAutoEnrollmentByUserId(userId: string): Promise<void> {
  const profile = await prisma.studentProfile.findUnique({
    where: { userId },
    select: { id: true, pathwayRel: { select: { requiresAutoEnrollment: true } } },
  })
  if (profile?.pathwayRel?.requiresAutoEnrollment) {
    await autoEnrollStudent(profile.id).catch(console.error)
  }
}

/**
 * Enrollment Engine to handle automatic and manual enrollment processes.
 * Aligns with the blueprint for path-specific auto-enrollment and scheduling.
 */

/**
 * Automatically enrolls a student in modules based on their pathway and current academic term.
 * Primarily for Full-Time and Military pathways.
 *
 * @param studentProfileId The ID of the student profile
 */
export async function autoEnrollStudent(studentProfileId: string): Promise<number> {
  // 1. Fetch student profile and their relational pathway
  const profile = await prisma.studentProfile.findUnique({
    where: { id: studentProfileId },
    include: {
      pathwayRel: {
        include: {
          academicTerms: {
            include: {
              courseAssignments: true,
            },
          },
        },
      },
      academicYear: true,
      semester: true,
    },
  })

  if (!profile || !profile.pathwayRel) {
    throw new Error('Student profile or relational pathway not found')
  }

  // 2. Determine if this pathway requires auto-enrollment
  if (!profile.pathwayRel.requiresAutoEnrollment) {
    return 0 // Pathway like MODULAR or EXAM_ONLY doesn't auto-enroll
  }

  // 3. Find the academic term mapping for the student's current year/semester
  const currentYear = profile.currentYearNumber || 1
  const currentSem = profile.currentSemesterNumber || 1
  const academicYearId = profile.academicYearId
  const semesterId = profile.semesterId

  const targetTerm = (profile.pathwayRel as any).academicTerms.find(
    (term: any) => term.yearNumber === currentYear && term.semesterNumber === currentSem
  )

  if (!targetTerm) {
    console.warn(
      `No academic term found for Year ${currentYear}, Sem ${currentSem} in pathway ${profile.pathwayRel.code}`
    )
    return 0
  }

  // 4. Filter for modules the student *actually* needs (deduplication)
  const { modules: requiredModules } = await getDeduplicatedModulesForStudent(studentProfileId)
  const requiredModuleIds = new Set(requiredModules.map((m: any) => m.id))

  // 5. Create enrollments for modules assigned to this term that the student needs
  let enrollmentCount = 0
  for (const assignment of targetTerm.courseAssignments) {
    if (requiredModuleIds.has(assignment.courseId)) {
      // Check if already enrolled
      const existing = await prisma.enrollment.findFirst({
        where: {
          userId: profile.userId,
          courseId: assignment.courseId,
        },
      })

      if (!existing) {
        const course = requiredModules.find(m => m.id === assignment.courseId);
        await prisma.enrollment.create({
          data: {
            userId: profile.userId,
            courseId: assignment.courseId,
            status: 'ENROLLED',
            amountPaid: course?.price || 0,
            academicYearId,
            semesterId,
          },
        })
        enrollmentCount++
      }
    }
  }

  return enrollmentCount
}

/**
 * Promotes an applicant to a student and triggers initial auto-enrollment.
 *
 * @param userId The ID of the applicant user
 * @param pathwayCode The code of the chosen study pathway (relational)
 * @param licenseCategoryCodes Array of license category codes (e.g. ['B1.1', 'B2'])
 */
export async function promoteAndEnroll(
  userId: string,
  pathwayCode: string,
  licenseCategoryCodes: string[]
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    // 1. Look up relational models
    const pathway = await tx.studyPathwayModel.findUnique({ where: { code: pathwayCode } })
    if (!pathway) throw new Error(`Pathway ${pathwayCode} not found`)

    const licenseCats = await tx.licenseCategory.findMany({
      where: { code: { in: licenseCategoryCodes } },
    })

    // 2. Update User role
    await tx.user.update({
      where: { id: userId },
      data: {
        role: 'STUDENT',
        status: 'ACTIVE',
      },
    })

    // 3. Create/Update Student Profile
    const profile = await tx.studentProfile.upsert({
      where: { userId },
      update: {
        pathwayId: pathway.id,
        enrollmentStatus: 'ENROLLED',
      },
      create: {
        userId,
        studentId: `AJA-TEMP-${Date.now()}`, // Temporary, actual one should be generated via helper
        pathwayId: pathway.id,
        enrollmentStatus: 'ENROLLED',
      },
    })

    // 4. Link License Targets
    for (const lc of licenseCats) {
      await tx.studentLicenseTarget.upsert({
        where: {
          studentProfileId_licenseCategoryId: {
            studentProfileId: profile.id,
            licenseCategoryId: lc.id,
          },
        },
        update: {},
        create: {
          studentProfileId: profile.id,
          licenseCategoryId: lc.id,
        },
      })
    }

    // Note: Actual auto-enrollment will be called outside the transaction or via a post-commit hook
    // to ensure deduplication has all updated data available.
  })
}
