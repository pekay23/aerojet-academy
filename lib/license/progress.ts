import prisma from '@/lib/prisma/client'

/**
 * Audit 4a — student EASA license progress.
 * For each license category the student is targeting, compares the category's
 * required modules against the modules the student has officially passed
 * (OFFICIAL_EASA ExamResult with passed = true).
 */

export interface LicenseModuleProgress {
  courseId: string
  code: string
  name: string
  passed: boolean
}

export interface LicenseProgress {
  licenseCategoryId: string
  code: string
  name: string
  totalRequired: number
  passedCount: number
  percentage: number
  modules: LicenseModuleProgress[]
}

export async function getLicenseProgress(userId: string): Promise<LicenseProgress[]> {
  const profile = await prisma.studentProfile.findUnique({
    where: { userId },
    select: {
      licenseTargets: {
        select: {
          licenseCategory: {
            select: {
              id: true,
              code: true,
              name: true,
              requirements: {
                select: {
                  course: { select: { id: true, code: true, name: true } },
                },
              },
            },
          },
        },
      },
    },
  })

  if (!profile || profile.licenseTargets.length === 0) return []

  const passedResults = await prisma.examResult.findMany({
    where: { userId, passed: true, examCategory: 'OFFICIAL_EASA' },
    select: {
      moduleCode: true,
      exam: { select: { examComponent: { select: { course: { select: { code: true } } } } } },
    },
  })

  const passedCodes = new Set<string>()
  for (const r of passedResults) {
    if (r.moduleCode) passedCodes.add(r.moduleCode.toUpperCase())
    const cc = r.exam?.examComponent?.course?.code
    if (cc) passedCodes.add(cc.toUpperCase())
  }

  return profile.licenseTargets.map(({ licenseCategory: lc }) => {
    const modules: LicenseModuleProgress[] = lc.requirements.map((req) => ({
      courseId: req.course.id,
      code: req.course.code,
      name: req.course.name,
      passed: passedCodes.has(req.course.code.toUpperCase()),
    }))
    const passedCount = modules.filter((m) => m.passed).length
    return {
      licenseCategoryId: lc.id,
      code: lc.code,
      name: lc.name,
      totalRequired: modules.length,
      passedCount,
      percentage: modules.length ? Math.round((passedCount / modules.length) * 100) : 0,
      modules,
    }
  })
}
