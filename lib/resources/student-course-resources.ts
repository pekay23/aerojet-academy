import 'server-only'

import { prismaUnfiltered } from '@/lib/prisma/client'
import { serializePrisma } from '@/lib/utils/serialization'

/**
 * Student-visible resources attached to a single course.
 *
 * `Course.syllabusUrl` / `Course.materialsUrl` are legacy single-URL fields.
 * Course staff now upload materials as `GeneralResource` rows (typically
 * tagged `ACADEMIC` or `EXAMINATION`, `showToStudents: true`, linked via
 * `Course.resources`).
 *
 * This helper returns course-specific learning materials — ACADEMIC and
 * EXAMINATION resources linked to this course. Resources tagged STUDENT_GUIDE
 * are shown in the Student Guide section instead and are excluded here.
 */
export async function getStudentCourseResources(courseId: string) {
  const resources = await prismaUnfiltered.generalResource.findMany({
    where: {
      showToStudents: true,
      courses: { some: { id: courseId } },
      // Exclude STUDENT_GUIDE from course-specific materials; those belong in
      // the Student Guide section regardless of course linking.
      category: { in: ['ACADEMIC', 'EXAMINATION'] },
    },
    include: {
      courses: { select: { id: true, code: true, name: true } },
    },
    orderBy: [{ category: 'asc' }, { createdAt: 'desc' }],
  })

  return serializePrisma(resources) as Array<{
    id: string
    name: string
    description: string | null
    url: string
    type: string
    category: string
    createdAt: string
    updatedAt: string
    courses: Array<{ id: string; code: string; name: string }>
  }>
}

/**
 * Student Guide resources.
 *
 * Two categories land here:
 *  1. Any resource tagged `STUDENT_GUIDE` — always a guide, regardless of
 *     whether it is linked to courses or not.
 *  2. Global (non-course-linked) resources that are NOT ACADEMIC or EXAMINATION
 *     (e.g. conduct policy, IT guidelines, administrative notices).
 *
 * These appear on every course's materials page so students always have
 * academy-wide reference material within reach.
 */
export async function getStudentGuideResources() {
  const resources = await prismaUnfiltered.generalResource.findMany({
    where: {
      showToStudents: true,
      OR: [
        // Canonical student guide category
        { category: 'STUDENT_GUIDE' },
        // Global resources that aren't course-specific academic/exam material
        {
          courses: { none: {} },
          category: { notIn: ['ACADEMIC', 'EXAMINATION'] },
        },
      ],
    },
    include: {
      courses: { select: { id: true, code: true, name: true } },
    },
    orderBy: [{ category: 'asc' }, { name: 'asc' }],
  })

  return serializePrisma(resources) as Array<{
    id: string
    name: string
    description: string | null
    url: string
    type: string
    category: string
    createdAt: string
    updatedAt: string
    courses: Array<{ id: string; code: string; name: string }>
  }>
}
