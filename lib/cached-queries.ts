import { unstable_cache } from 'next/cache'
import { prismaUnfiltered } from '@/lib/prisma/client'

/**
 * Cached reference data queries for frequently-read, rarely-changed data.
 * All use prismaUnfiltered to bypass RLS overhead.
 */

// Academic structure data changes rarely (yearly) — cache for 1 hour
const STRUCTURE_TTL = 3600
// Operational data changes more frequently — cache for 5 minutes
const OPERATIONAL_TTL = 300

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
      include: {
        requirements: { include: { course: { select: { id: true, code: true } } } },
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
      include: { course: { select: { id: true, name: true, code: true } } },
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
      include: { category: true },
      orderBy: { code: 'asc' },
    })
  },
  ['active-courses'],
  { revalidate: OPERATIONAL_TTL, tags: ['courses'] }
)
