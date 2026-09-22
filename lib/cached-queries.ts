import { unstable_cache } from 'next/cache'
import { prismaUnfiltered } from '@/lib/prisma/client'

const STRUCTURE_TTL = 3600
const OPERATIONAL_TTL = 300

const LICENSE_CATEGORY_REQUIREMENT_SELECT = {
  id: true,
  courseId: true,
  course: { select: { id: true, code: true } },
} as const

export const getCachedCourseCategories = unstable_cache(
  async () => {
    return prismaUnfiltered.courseCategory.findMany({
      orderBy: { name: 'asc' },
    })
  },
  ['course-categories'],
  { revalidate: STRUCTURE_TTL, tags: ['course-categories'] }
)

export const getCachedLicenseCategories = unstable_cache(
  async () => {
    return prismaUnfiltered.licenseCategory.findMany({
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        requirements: {
          select: LICENSE_CATEGORY_REQUIREMENT_SELECT,
          take: 100,
        },
      },
      orderBy: { code: 'asc' },
    })
  },
  ['license-categories'],
  { revalidate: STRUCTURE_TTL, tags: ['license-categories'] }
)

export const getCachedAcademicYears = unstable_cache(
  async () => {
    return prismaUnfiltered.academicYear.findMany({ orderBy: { startDate: 'desc' } })
  },
  ['academic-years'],
  { revalidate: STRUCTURE_TTL, tags: ['academic-years'] }
)

export const getCachedSemesters = unstable_cache(
  async () => {
    return prismaUnfiltered.semester.findMany({ orderBy: { startDate: 'desc' } })
  },
  ['semesters'],
  { revalidate: STRUCTURE_TTL, tags: ['semesters'] }
)

export const getCachedExamComponents = unstable_cache(
  async () => {
    return prismaUnfiltered.examComponent.findMany({
      select: {
        id: true,
        code: true,
        name: true,
        type: true,
        duration: true,
        categoryCode: true,
        questionCount: true,
        courseId: true,
        course: { select: { id: true, name: true, code: true } },
      },
      take: 500,
      orderBy: { code: 'asc' },
    })
  },
  ['exam-components'],
  { revalidate: OPERATIONAL_TTL, tags: ['exam-components'] }
)

export const getCachedActiveCourses = unstable_cache(
  async () => {
    return prismaUnfiltered.course.findMany({
      where: { isActive: true },
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        moduleType: true,
        duration: true,
        price: true,
        currency: true,
        isActive: true,
        requiresPrerequisite: true,
        prerequisites: true,
        syllabusUrl: true,
        categoryId: true,
        category: { select: { id: true, name: true } },
      },
      take: 1000,
      orderBy: { code: 'asc' },
    })
  },
  ['active-courses'],
  { revalidate: OPERATIONAL_TTL, tags: ['courses'] }
)
