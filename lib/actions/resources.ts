'use server'

import { prismaUnfiltered } from '@/lib/prisma/client'
import { requireStaff, requireAuth } from '@/lib/auth/helpers'
import { serializePrisma } from '@/lib/utils/serialization'
import { revalidatePath } from 'next/cache'
import { createAuditLog, AuditAction } from '@/lib/audit/logger'

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
    select: { pathwayId: true },
  })

  // 2. Get all "bought" or enrolled courses for the student
  // This includes full-time enrollments and modular ones
  const [ftEnrollments, modularEnrollments] = await Promise.all([
    prismaUnfiltered.enrollment.findMany({
      where: {
        userId,
        status: { in: ['ENROLLED', 'APPROVED', 'ACTIVE'] },
      },
      select: { courseId: true },
    }),
    prismaUnfiltered.modularEnrollment.findMany({
      where: {
        studentId: userId,
        status: { in: ['ENROLLED', 'APPROVED', 'ACTIVE'] },
      },
      include: { package: true },
    }),
  ])

  const enrolledCourseIds = new Set(ftEnrollments.map((e) => e.courseId))

  // Add modular course IDs (ModularPackage has modulesIncluded as codes, we need IDs)
  // We'll fetch course IDs for those codes
  const allModularCodes = modularEnrollments.flatMap((e) => e.package.modulesIncluded)
  if (allModularCodes.length > 0) {
    const modularCourses = await prismaUnfiltered.course.findMany({
      where: { code: { in: allModularCodes } },
      select: { id: true },
    })
    modularCourses.forEach((c) => enrolledCourseIds.add(c.id))
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
            { courses: { some: { id: { in: courseIds } } } }, // Linked to enrolled course
          ],
        },
        {
          OR: [
            { pathways: { none: {} } }, // Global or not pathway-restricted
            { pathways: { some: { id: profile?.pathwayId || 'none' } } }, // Linked to their pathway
          ],
        },
      ],
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

// Allowed URL protocols — relative paths (/foo) and absolute (https://, http://, mailto:, tel:)
const SAFE_URL_RE = /^(\/|[a-z][a-z\d+\-.]*:\/\/)/i

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

  // Reject dangerous URL schemes (javascript:, data:, vbscript:, …)
  if (!SAFE_URL_RE.test(rest.url)) {
    throw new Error(
      'Invalid resource URL. Only http(s), mailto, tel, or relative paths are allowed.'
    )
  }

  // ── Category-aware visibility guard ──────────────────────────────────────
  // STUDENT_GUIDE: always global and visible to everyone (enforced, not optional).
  // ADMINISTRATIVE / INSTITUTIONAL: never visible to students (staff/in instructor only).
  const visibility =
    data.category === 'STUDENT_GUIDE'
      ? { showToInstructors: true, showToStaff: true, showToStudents: true }
      : data.category === 'ADMINISTRATIVE' || data.category === 'INSTITUTIONAL'
        ? {
            showToInstructors: rest.showToInstructors,
            showToStaff: rest.showToStaff,
            showToStudents: false,
          }
        : {
            showToInstructors: rest.showToInstructors,
            showToStaff: rest.showToStaff,
            showToStudents: rest.showToStudents,
          }

  const finalData = { ...rest, ...visibility }
  const isNew = !data.id

  const resource = await prismaUnfiltered.generalResource.upsert({
    where: { id: data.id ?? undefined },
    update: {
      ...finalData,
      courses: {
        set: courseIds.map((id) => ({ id })),
      },
      pathways: {
        set: pathwayIds.map((id) => ({ id })),
      },
    },
    create: {
      ...finalData,
      courses: {
        connect: courseIds.map((id) => ({ id })),
      },
      pathways: {
        connect: pathwayIds.map((id) => ({ id })),
      },
    },
  })

  await createAuditLog({
    action: isNew ? AuditAction.CREATE : AuditAction.UPDATE,
    entity: 'GeneralResource',
    entityId: resource.id,
    userId: (await requireStaff()).id,
    description: isNew
      ? `Created resource: ${resource.name}`
      : `Updated resource: ${resource.name}`,
    changes: {
      before: null,
      after: {
        name: resource.name,
        category: resource.category,
        url: resource.url,
        type: resource.type,
      },
    },
  })

  revalidatePath('/instructor/resources')
  revalidatePath('/staff/resources')
  revalidatePath('/student/resources')
  revalidatePath('/student/courses')
  revalidatePath('/student/courses/[slug]')
  revalidatePath('/student/courses/[slug]/materials')
  return serializePrisma(resource)
}

export async function deleteResource(id: string) {
  await requireStaff()

  const existing = await prismaUnfiltered.generalResource.findUnique({ where: { id } })
  if (!existing) {
    return { success: false, error: 'Resource not found' }
  }

  await prismaUnfiltered.generalResource.delete({
    where: { id },
  })

  await createAuditLog({
    action: AuditAction.DELETE,
    entity: 'GeneralResource',
    entityId: id,
    userId: (await requireStaff()).id,
    description: `Deleted resource: ${existing.name}`,
    changes: {
      before: { name: existing.name, category: existing.category, url: existing.url },
      after: null,
    },
  })

  revalidatePath('/instructor/resources')
  revalidatePath('/staff/resources')
  revalidatePath('/student/resources')
  return { success: true }
}
