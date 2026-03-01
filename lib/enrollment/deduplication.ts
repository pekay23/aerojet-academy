import prisma from '@/lib/prisma/client'
import { Course } from '@prisma/client'

/**
 * Service to handle module deduplication for students targeting multiple license categories.
 * Ensures that if a student is pursuing B1.1 and B2, they only study the common modules once.
 */

export interface DeduplicatedModuleSet {
  modules: Course[]
  totalPrice: number
  currency: string
}

/**
 * Calculates the unique set of modules required for a student targeting multiple license categories.
 *
 * @param studentProfileId The ID of the student profile
 * @returns A deduplicated set of modules and total price
 */
export async function getDeduplicatedModulesForStudent(
  studentProfileId: string
): Promise<DeduplicatedModuleSet> {
  // 1. Get student's target license categories
  const targets = await prisma.studentLicenseTarget.findMany({
    where: { studentProfileId },
    include: {
      licenseCategory: {
        include: {
          requirements: {
            include: {
              course: true,
            },
          },
        },
      },
    },
  })

  // 2. Map all courses to a unique set
  const moduleMap = new Map<string, Course>()

  targets.forEach((target) => {
    target.licenseCategory.requirements.forEach((req) => {
      if (!moduleMap.has(req.course.id)) {
        moduleMap.set(req.course.id, req.course)
      }
    })
  })

  const uniqueModules = Array.from(moduleMap.values())

  // 3. Calculate total price
  const totalPrice = uniqueModules.reduce((sum, course) => sum + Number(course.price), 0)

  return {
    modules: uniqueModules,
    totalPrice,
    currency: uniqueModules[0]?.currency || 'EUR',
  }
}

/**
 * Gets unique modules for a raw list of license category IDs.
 * Useful during applicant approval or pathway selection preview.
 *
 * @param licenseCategoryIds Array of license category IDs
 */
export async function getRequiredModulesForLicenses(
  licenseCategoryIds: string[]
): Promise<DeduplicatedModuleSet> {
  const requirements = await prisma.licenseModuleRequirement.findMany({
    where: {
      licenseCategoryId: { in: licenseCategoryIds },
    },
    include: {
      course: true,
    },
  })

  const moduleMap = new Map<string, Course>()
  requirements.forEach((req) => {
    if (!moduleMap.has(req.course.id)) {
      moduleMap.set(req.course.id, req.course)
    }
  })

  const uniqueModules = Array.from(moduleMap.values())
  const totalPrice = uniqueModules.reduce((sum, course) => sum + Number(course.price), 0)

  return {
    modules: uniqueModules,
    totalPrice,
    currency: uniqueModules[0]?.currency || 'EUR',
  }
}
