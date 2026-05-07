import { EnrollmentType, ProgrammeChoice } from '@prisma/client'
import prisma from '@/lib/prisma/client'
import { resolveEffectiveEnrollmentType } from './pathway'

/**
 * Validates if a student can be enrolled in a specific Full-Time Programme.
 */
export async function validateFullTimeProgrammeEnrollment(userId: string, programmeCode: string): Promise<{ allowed: boolean; error?: string; severity: 'ERROR' | 'WARNING' }> {
  const profile = await prisma.studentProfile.findUnique({
    where: { userId },
    include: { pathwayRel: true }
  })

  if (!profile) return { allowed: true, severity: 'ERROR' }

  const effectiveEnrollmentType = resolveEffectiveEnrollmentType({
    pathwayCode: profile.pathwayRel?.code,
    enrollmentType: profile.enrollmentType,
  })

  // Rule 1: 4-Year Full-Time students cannot enroll in 12-Month Military Certification
  if (profile.pathwayRel?.code === 'FULL_TIME_4Y' && programmeCode === 'MIL_1Y_B1') {
    return { 
      allowed: false, 
      error: '4-Year Full-Time students are not eligible for the 12-Month Military Certification.',
      severity: 'WARNING' // Staff can override
    }
  }

  // Rule 2: Modular or Exam-Only students cannot enroll in Full-Time Programmes
  if (effectiveEnrollmentType === 'MODULAR' || effectiveEnrollmentType === 'EXAM_ONLY') {
    return {
      allowed: false,
      error: `${effectiveEnrollmentType.replace('_', '-')} students cannot enroll in Full-Time Programmes.`,
      severity: 'WARNING' // Staff can override
    }
  }

  return { allowed: true, severity: 'ERROR' }
}

/**
 * Validates if a student can have OJT (On-the-Job Training) records.
 */
export async function validateOjtAccess(userId: string): Promise<{ allowed: boolean; error?: string; severity: 'ERROR' | 'WARNING' }> {
  const profile = await prisma.studentProfile.findUnique({
    where: { userId },
    include: { pathwayRel: true }
  })

  if (!profile) return { allowed: false, error: 'Student profile not found.', severity: 'ERROR' }

  const effectiveEnrollmentType = resolveEffectiveEnrollmentType({
    pathwayCode: profile.pathwayRel?.code,
    enrollmentType: profile.enrollmentType,
  })

  // Rule: Exam Only or Modular students cannot enroll in OJT
  if (effectiveEnrollmentType === 'EXAM_ONLY' || effectiveEnrollmentType === 'MODULAR') {
    return {
      allowed: false,
      error: `${effectiveEnrollmentType.replace('_', '-')} students are not eligible for On-the-Job Training (OJT).`,
      severity: 'WARNING'
    }
  }

  // Also check if the pathway specifically includes OJT
  if (profile.pathwayRel && !profile.pathwayRel.includesOjt) {
     return {
      allowed: false,
      error: `The student's current pathway (${profile.pathwayRel.name}) does not include On-the-Job Training (OJT).`,
      severity: 'WARNING'
    }
  }

  return { allowed: true, severity: 'ERROR' }
}

/**
 * Validates if a student can enroll in a specific course (module).
 */
export async function validateCourseEnrollment(userId: string, courseId: string): Promise<{ allowed: boolean; error?: string; severity: 'ERROR' | 'WARNING' }> {
  const [profile, course] = await Promise.all([
    prisma.studentProfile.findUnique({
      where: { userId },
      include: { pathwayRel: true }
    }),
    prisma.course.findUnique({
      where: { id: courseId },
      include: { category: true }
    })
  ])

  if (!profile) return { allowed: false, error: 'Student profile not found.', severity: 'ERROR' }
  if (!course) return { allowed: false, error: 'Course not found.', severity: 'ERROR' }

  const effectiveEnrollmentType = resolveEffectiveEnrollmentType({
    pathwayCode: profile.pathwayRel?.code,
    enrollmentType: profile.enrollmentType,
  })

  // Rule 1: Exam Only students cannot enroll in any training modules
  if (effectiveEnrollmentType === 'EXAM_ONLY') {
    return {
      allowed: false,
      error: 'Exam-Only students cannot enroll in training modules. Please contact support to change your pathway.',
      severity: 'WARNING'
    }
  }

  // Rule 2: Modular students cannot enroll in Full-Time specific categories
  const fullTimeCategories = ['FOUR_YEAR', 'TWO_YEAR', 'MILITARY']
  if (effectiveEnrollmentType === 'MODULAR' && course.category && fullTimeCategories.includes(course.category.name)) {
    return {
      allowed: false,
      error: `Modular students cannot enroll in courses specific to ${course.category.name.replace('_', ' ')} programmes.`,
      severity: 'WARNING'
    }
  }

  // Rule 3: Pre-requisite validation
  if (course.requiresPrerequisite && course.prerequisites.length > 0) {
    const prereqResult = await validatePrerequisites(userId, course.prerequisites)
    if (!prereqResult.allowed) return prereqResult
  }

  return { allowed: true, severity: 'ERROR' }
}

/**
 * Validates that a student has completed all prerequisite courses.
 * A course is considered "completed" if the student has an enrollment with status
 * GRADUATED, or has at least one passing grade (A, B, or C) for that course.
 */
export async function validatePrerequisites(
  userId: string,
  prerequisiteCodes: string[]
): Promise<{ allowed: boolean; error?: string; severity: 'ERROR' | 'WARNING' }> {
  if (prerequisiteCodes.length === 0) return { allowed: true, severity: 'ERROR' }

  // Find all prerequisite courses by code
  const prereqCourses = await prisma.course.findMany({
    where: { code: { in: prerequisiteCodes } },
    select: { id: true, code: true, name: true },
  })

  // Check for any codes that don't match real courses (stale data)
  const foundCodes = new Set(prereqCourses.map(c => c.code))
  const missingCodes = prerequisiteCodes.filter(c => !foundCodes.has(c))
  if (missingCodes.length > 0) {
    return {
      allowed: false,
      error: `Prerequisite course(s) not found: ${missingCodes.join(', ')}. Please contact support.`,
      severity: 'ERROR',
    }
  }

  // Fetch the student's enrollments + grades for prerequisite courses
  const prereqCourseIds = prereqCourses.map(c => c.id)
  const enrollments = await prisma.enrollment.findMany({
    where: {
      userId,
      courseId: { in: prereqCourseIds },
      deletedAt: null,
    },
    select: {
      courseId: true,
      status: true,
      grades: {
        select: { grade: true },
        where: { deletedAt: null },
      },
    },
  })

  const PASSING_GRADES = ['A', 'B', 'C']
  const completedCourseIds = new Set<string>()

  for (const enrollment of enrollments) {
    // Completed if GRADUATED
    if (enrollment.status === 'GRADUATED') {
      completedCourseIds.add(enrollment.courseId)
      continue
    }
    // Or if any passing grade exists
    if (enrollment.grades.some(g => g.grade && PASSING_GRADES.includes(g.grade))) {
      completedCourseIds.add(enrollment.courseId)
    }
  }

  const unmetPrereqs = prereqCourses.filter(c => !completedCourseIds.has(c.id))
  if (unmetPrereqs.length > 0) {
    const names = unmetPrereqs.map(c => `${c.code} (${c.name})`).join(', ')
    return {
      allowed: false,
      error: `You must complete the following prerequisite(s) first: ${names}`,
      severity: 'WARNING',
    }
  }

  return { allowed: true, severity: 'ERROR' }
}

