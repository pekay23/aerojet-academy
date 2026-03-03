import { promoteApplicantToStudent } from '@/lib/enrollment/pathway'
import type { PromotionResult } from './types'
import type { EnrollmentType } from '@prisma/client'

/**
 * @deprecated Use `promoteApplicantToStudent` directly from `lib/enrollment/pathway.ts`
 * This function is kept for backward compatibility and routes the call to the new consolidated logic.
 */
export async function promoteToStudent(
  userId: string,
  enrollmentType: EnrollmentType = 'MODULAR'
): Promise<PromotionResult> {
  try {
    const result = await promoteApplicantToStudent(userId, userId)
    return { success: true, studentId: result.studentId }
  } catch (err: any) {
    console.error('[PROMOTION ERROR]', err)
    return { success: false, error: err.message }
  }
}
