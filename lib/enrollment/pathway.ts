import { EnrollmentType, ProgrammeChoice } from '@prisma/client'
import prisma from '@/lib/prisma/client'
import { triggerAutoEnrollmentByUserId } from './engine'
import { sendStudentPromotionEmail } from '@/lib/email/service'
import { createAuditLog, AuditAction } from '@/lib/audit/logger'
import { generateStudentId } from '@/lib/auth/helpers'

/**
 * Maps a ProgrammeChoice (or raw string) to the relational StudyPathwayModel code.
 */
export function mapProgrammeChoiceToPathwayCode(choice: string | null | undefined): string {
  const map: Record<string, string> = {
    FULL_TIME_4YEAR: 'FULL_TIME_4Y',
    FULL_TIME_2YEAR: 'FULL_TIME_2Y',
    MILITARY_1YEAR: 'MILITARY_1Y',
    MODULAR: 'MODULAR',
    EXAM_ONLY: 'EXAM_ONLY',
  }
  return map[choice || ''] || 'MODULAR'
}

/**
 * Resolves the higher-level EnrollmentType from a specific ProgrammeChoice.
 */
export function resolveEnrollmentType(programme: ProgrammeChoice): EnrollmentType {
  switch (programme) {
    case 'FULL_TIME_4YEAR':
    case 'FULL_TIME_2YEAR':
    case 'MILITARY_1YEAR':
      return 'FULL_TIME'
    case 'MODULAR':
      return 'MODULAR'
    case 'EXAM_ONLY':
      return 'EXAM_ONLY'
    default:
      return 'SHORT_COURSE'
  }
}

function normalizeEnrollmentType(
  enrollmentType: EnrollmentType | string | null | undefined
): EnrollmentType | null {
  switch (enrollmentType) {
    case 'FULL_TIME':
    case 'MODULAR':
    case 'EXAM_ONLY':
    case 'SHORT_COURSE':
      return enrollmentType
    default:
      return null
  }
}

function mapPathwayCodeToEnrollmentType(
  pathwayCode: string | null | undefined
): EnrollmentType | null {
  switch (pathwayCode) {
    case 'FULL_TIME':
    case 'FULL_TIME_4Y':
    case 'FULL_TIME_2Y':
    case 'MILITARY_1Y':
    case 'MILITARY_2Y':
      return 'FULL_TIME'
    case 'MODULAR':
      return 'MODULAR'
    case 'EXAM_ONLY':
      return 'EXAM_ONLY'
    case 'SHORT_COURSE':
      return 'SHORT_COURSE'
    default:
      return null
  }
}

function resolveEnrollmentTypeFromChoice(
  programmeChoice: ProgrammeChoice | string | null | undefined
): EnrollmentType | null {
  switch (programmeChoice) {
    case 'FULL_TIME_4YEAR':
    case 'FULL_TIME_2YEAR':
    case 'MILITARY_1YEAR':
      return 'FULL_TIME'
    case 'MODULAR':
      return 'MODULAR'
    case 'EXAM_ONLY':
      return 'EXAM_ONLY'
    default:
      return null
  }
}

function normalizePathwayCodeFromEnrollmentType(
  enrollmentType: EnrollmentType | string | null | undefined
): string | null {
  switch (enrollmentType) {
    case 'FULL_TIME':
      return 'FULL_TIME'
    case 'MODULAR':
      return 'MODULAR'
    case 'EXAM_ONLY':
      return 'EXAM_ONLY'
    case 'SHORT_COURSE':
      return 'SHORT_COURSE'
    default:
      return null
  }
}

export function resolveEffectivePathwayCode(input: {
  pathwayCode?: string | null
  programmeChoice?: ProgrammeChoice | string | null
  enrollmentType?: EnrollmentType | string | null
}): string | null {
  return (
    input.pathwayCode ||
    (input.programmeChoice ? mapProgrammeChoiceToPathwayCode(input.programmeChoice) : null) ||
    normalizePathwayCodeFromEnrollmentType(input.enrollmentType)
  )
}

export function resolveEffectiveEnrollmentType(input: {
  pathwayCode?: string | null
  programmeChoice?: ProgrammeChoice | string | null
  enrollmentType?: EnrollmentType | string | null
}): EnrollmentType | null {
  return (
    mapPathwayCodeToEnrollmentType(input.pathwayCode) ||
    resolveEnrollmentTypeFromChoice(input.programmeChoice) ||
    normalizeEnrollmentType(input.enrollmentType)
  )
}

/**
 * Defines what a student can see in the catalog based on their enrollment type.
 */
export function getCatalogVisibility(enrollmentType: EnrollmentType | null) {
  // If not logged in or no type, show everything public
  if (!enrollmentType) {
    return {
      showEasaModules: true,
      showExamOnlyVariants: false,
      showShortCourses: true,
      canPurchaseEasaModules: true,
    }
  }

  switch (enrollmentType) {
    case 'FULL_TIME':
      return {
        showEasaModules: false, // They are auto-enrolled, shouldn't buy individually
        showExamOnlyVariants: false,
        showShortCourses: true,
        canPurchaseEasaModules: false,
      }
    case 'MODULAR':
      return {
        showEasaModules: true,
        showExamOnlyVariants: false,
        showShortCourses: true,
        canPurchaseEasaModules: true,
      }
    case 'EXAM_ONLY':
      return {
        showEasaModules: true, // They see them but...
        showExamOnlyVariants: true, // ...specifically the exam-only versions
        showShortCourses: true,
        canPurchaseEasaModules: false, // Cannot buy tuition version
      }
    case 'SHORT_COURSE':
    default:
      return {
        showEasaModules: true,
        showExamOnlyVariants: false,
        showShortCourses: true,
        canPurchaseEasaModules: true,
      }
  }
}

/**
 * Checks if a student is allowed to access materials.
 * Per user: Exam-only students CAN access materials after payment, just not classes.
 */
export function canAccessMaterials(enrollmentType: EnrollmentType) {
  // All pathways can access materials if paid
  return true
}

/**
 * Checks if a student is allowed to attend live classes.
 */
export function canAccessClasses(enrollmentType: EnrollmentType) {
  // Exam-only students are strictly forbidden from classes
  return enrollmentType !== 'EXAM_ONLY'
}

/**
 * Payment reference types that trigger APPLICANT → STUDENT promotion per pathway.
 */
const PROMOTION_TRIGGERS: Record<string, string[]> = {
  // SEAT_CONFIRMATION activates enrollment and promotes to student.
  FULL_TIME: ['SEAT_CONFIRMATION', 'YEAR_1_FULL', 'FULL_PROGRAMME'],
  MODULAR: ['COURSE'],
  // EXAM_ONLY promotion is handled directly in join-pool/book-exam routes on first booking,
  // NOT on wallet top-up (topping up should not make you a student).
  EXAM_ONLY: ['EXAM'],
  SHORT_COURSE: ['COURSE'],
}

/**
 * Checks if a given payment reference type satisfies the promotion conditions
 * for the user's enrollment pathway.
 */
export function shouldPromoteOnPayment(
  programmeChoice: ProgrammeChoice | null,
  paymentReferenceType: string
): boolean {
  const enrollmentType = programmeChoice ? resolveEnrollmentType(programmeChoice) : 'MODULAR'
  const triggers = PROMOTION_TRIGGERS[enrollmentType] || PROMOTION_TRIGGERS['MODULAR']
  return triggers.includes(paymentReferenceType)
}

/**
 * Promotes an APPLICANT to STUDENT.
 * Creates StudentProfile, updates role, triggers auto-enrollment for FT/Military.
 */
/**
 * Check if this is a user's first exam activity and promote them from APPLICANT to STUDENT if so.
 * Used by exam-only booking routes (book-exam, join-pool, bundles).
 * Returns whether promotion occurred.
 */
export async function promoteIfFirstExamActivity(userId: string): Promise<boolean> {
  const [user, membershipCount, bookingCount] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { role: true } }),
    prisma.poolMembership.count({ where: { userId } }),
    prisma.examBooking.count({ where: { userId } }),
  ])

  if (!user || user.role !== 'APPLICANT') return false
  // Promote if this is among their first exam activities
  if (membershipCount > 1 && bookingCount > 1) return false

  try {
    await promoteApplicantToStudent(userId, userId)
    return true
  } catch (e) {
    console.error('[PROMOTION] Failed for user', userId, e)
    return false
  }
}

/**
 * Inline role upgrade within an existing transaction context.
 * Used by full-time enrollment and tuition booking flows where a full
 * promoteApplicantToStudent call isn't needed (studentProfile already exists).
 */
export async function upgradeRoleInTransaction(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  userId: string
): Promise<boolean> {
  const user = await tx.user.findUnique({ where: { id: userId }, select: { role: true } })
  if (user?.role !== 'APPLICANT') return false

  await tx.user.update({ where: { id: userId }, data: { role: 'STUDENT' } })
  await tx.studentProfile.update({ where: { userId }, data: { enrollmentStatus: 'ENROLLED' } })
  return true
}

export async function promoteApplicantToStudent(
  userId: string,
  actorId: string
): Promise<{ studentId: string }> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    include: { profile: true, studentProfile: true },
  })

  // Guard: only promote active applicants who haven't already been promoted
  if (user.role !== 'APPLICANT') {
    throw new Error(`Cannot promote user with role ${user.role}`)
  }
  if (user.studentProfile) {
    return { studentId: user.studentProfile.studentId }
  }

  const studentId = await generateStudentId()
  const enrollmentType = user.programmeChoice
    ? resolveEnrollmentType(user.programmeChoice as ProgrammeChoice)
    : 'MODULAR'
  const pathwayCode = mapProgrammeChoiceToPathwayCode(user.programmeChoice)

  await prisma.$transaction(async (tx) => {
    // Look up the relational pathway
    const pathway = await tx.studyPathwayModel.findUnique({
      where: { code: pathwayCode },
    })

    // Create StudentProfile
    const studentProfile = await tx.studentProfile.create({
      data: {
        userId,
        studentId,
        enrollmentType: enrollmentType as any,
        enrollmentStatus: 'ENROLLED',
        pathwayId: pathway?.id ?? null,
      },
    })

    // Promote role
    await tx.user.update({
      where: { id: userId },
      data: { role: 'STUDENT' },
    })

    // Create StudentLicenseTarget entries from selected license categories
    if (user.selectedLicenseCategories && user.selectedLicenseCategories.length > 0) {
      const licenseCategories = await tx.licenseCategory.findMany({
        where: { code: { in: user.selectedLicenseCategories } },
        select: { id: true },
      })
      if (licenseCategories.length > 0) {
        await tx.studentLicenseTarget.createMany({
          data: licenseCategories.map((lc) => ({
            studentProfileId: studentProfile.id,
            licenseCategoryId: lc.id,
          })),
          skipDuplicates: true,
        })
      }
    }

    // Ensure wallet exists
    const wallet = await tx.wallet.findUnique({ where: { userId } })
    if (!wallet) {
      await tx.wallet.create({
        data: {
          userId,
          balance: 0,
          reservedBalance: 0,
          availableBalance: 0,
        },
      })
    }
  })

  // Post-transaction: auto-enrollment for FT/Military pathways
  await triggerAutoEnrollmentByUserId(userId)

  // Send promotion email
  if (user.profile) {
    sendStudentPromotionEmail(user.email, user.profile.firstName, studentId).catch(console.error)
  }

  // Audit log
  await createAuditLog({
    action: AuditAction.APPROVE,
    entity: 'StudentPromotion',
    entityId: userId,
    userId: actorId,
    details: { studentId, enrollmentType, pathwayCode },
  })

  return { studentId }
}
