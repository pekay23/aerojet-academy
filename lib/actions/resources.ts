'use server'

import { prismaUnfiltered } from '@/lib/prisma/client'
import { requireStaff, requireAuth } from '@/lib/auth/helpers'
import { serializePrisma } from '@/lib/utils/serialization'
import { revalidatePath } from 'next/cache'

export async function getAdminResources() {
  await requireStaff()

  const resources = await prismaUnfiltered.generalResource.findMany({
    include: {
      courses: { select: { id: true, code: true, name: true } },
      pathways: { select: { id: true, code: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return serializePrisma(resources)
}

export async function getResourceLinkingOptions() {
  await requireStaff()

  const [courses, pathways] = await Promise.all([
    prismaUnfiltered.course.findMany({
      where: { isActive: true },
      select: { id: true, code: true, name: true },
      orderBy: { code: 'asc' },
    }),
    prismaUnfiltered.studyPathwayModel.findMany({
      select: { id: true, code: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ])

  return serializePrisma({ courses, pathways })
}

export async function getStudentResources() {
  const session = await requireAuth()
  const userId = session.id

  // 1. Get student status and pathway
  const profile = await prismaUnfiltered.studentProfile.findUnique({
    where: { userId },
    select: { pathwayId: true }
  })

  // 2. Get all "bought" or enrolled courses for the student
  // This includes full-time enrollments and modular ones
  const [ftEnrollments, modularEnrollments] = await Promise.all([
    prismaUnfiltered.enrollment.findMany({
      where: { 
        userId, 
        status: { in: ['ENROLLED', 'APPROVED', 'ACTIVE'] } 
      },
      select: { courseId: true }
    }),
    prismaUnfiltered.modularEnrollment.findMany({
      where: { 
        studentId: userId, 
        status: { in: ['ENROLLED', 'APPROVED', 'ACTIVE'] } 
      },
      include: { package: true }
    })
  ])

  const enrolledCourseIds = new Set(ftEnrollments.map(e => e.courseId))
  
  // Add modular course IDs (ModularPackage has modulesIncluded as codes, we need IDs)
  // We'll fetch course IDs for those codes
  const allModularCodes = modularEnrollments.flatMap(e => e.package.modulesIncluded)
  if (allModularCodes.length > 0) {
    const modularCourses = await prismaUnfiltered.course.findMany({
      where: { code: { in: allModularCodes } },
      select: { id: true }
    })
    modularCourses.forEach(c => enrolledCourseIds.add(c.id))
  }

  const courseIds = Array.from(enrolledCourseIds)

  // 3. Fetch resources
  const resources = await prismaUnfiltered.generalResource.findMany({
    where: {
      showToStudents: true,
      AND: [
        {
          OR: [
            { courses: { none: {} } }, // Global resource
            { courses: { some: { id: { in: courseIds } } } } // Linked to enrolled course
          ]
        },
        {
          OR: [
            { pathways: { none: {} } }, // Global or not pathway-restricted
            { pathways: { some: { id: profile?.pathwayId || 'none' } } } // Linked to their pathway
          ]
        }
      ]
    },
    include: {
      courses: { select: { id: true, code: true } },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  return serializePrisma(resources)
}

export async function upsertResource(data: {
  id?: string
  name: string
  description?: string
  url: string
  type: string
  category: string
  showToInstructors: boolean
  showToStaff: boolean
  showToStudents: boolean
  courseIds?: string[]
  pathwayIds?: string[]
}) {
  await requireStaff()

  const { courseIds = [], pathwayIds = [], ...rest } = data

  const resource = await prismaUnfiltered.generalResource.upsert({
    where: { id: data.id || 'new' },
    update: {
      ...rest,
      courses: {
        set: courseIds.map(id => ({ id }))
      },
      pathways: {
        set: pathwayIds.map(id => ({ id }))
      }
    },
    create: {
      ...rest,
      courses: {
        connect: courseIds.map(id => ({ id }))
      },
      pathways: {
        connect: pathwayIds.map(id => ({ id }))
      }
    },
  })

  revalidatePath('/instructor/resources')
  revalidatePath('/staff/resources')
  revalidatePath('/student/resources')
  return serializePrisma(resource)
}

export async function deleteResource(id: string) {
  await requireStaff()

  await prismaUnfiltered.generalResource.delete({
    where: { id },
  })

  revalidatePath('/instructor/resources')
  revalidatePath('/staff/resources')
  revalidatePath('/student/resources')
  return { success: true }
}
