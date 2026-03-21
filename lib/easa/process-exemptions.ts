import prisma from '@/lib/prisma/client'
import { getExemptions } from './category-hierarchy'

/**
 * Process category exemptions after a student passes an exam.
 *
 * Looks up applicable lower-category exemptions based on the passed category
 * and module, then upserts ExamExemption records. Idempotent — safe to call
 * multiple times for the same result.
 */
export async function processExemptionsForResult(params: {
  userId: string
  moduleCode: string
  passedCategory: string
  componentId?: string
}): Promise<Array<{ moduleCode: string; exemptedCategory: string }>> {
  const { userId, moduleCode, passedCategory, componentId } = params

  const exemptions = getExemptions(passedCategory, moduleCode)

  if (exemptions.length === 0) {
    return []
  }

  const results: Array<{ moduleCode: string; exemptedCategory: string }> = []

  for (const exemption of exemptions) {
    await prisma.examExemption.upsert({
      where: {
        userId_moduleCode_exemptedCategory: {
          userId,
          moduleCode: exemption.moduleCode,
          exemptedCategory: exemption.targetCategory,
        },
      },
      update: {
        grantedByCategory: passedCategory,
        grantedByComponentId: componentId ?? null,
      },
      create: {
        userId,
        moduleCode: exemption.moduleCode,
        exemptedCategory: exemption.targetCategory,
        grantedByCategory: passedCategory,
        grantedByComponentId: componentId ?? null,
      },
    })

    results.push({
      moduleCode: exemption.moduleCode,
      exemptedCategory: exemption.targetCategory,
    })
  }

  return results
}
