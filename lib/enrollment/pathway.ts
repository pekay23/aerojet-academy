import { EnrollmentType, ProgrammeChoice } from '@prisma/client'

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
