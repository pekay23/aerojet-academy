'use server'

import { requireStaff } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { unstable_cache } from 'next/cache'
import { UserRole } from '@prisma/client'
import { handleActionError } from '@/lib/staff/errors'

interface StudentOption {
  id: string
  email: string
  firstName: string
  lastName: string
  studentId: string
}

interface ModuleOption {
  id: string
  courseId: string
  code: string
  name: string
  moduleCode: string
  isComponent: boolean
}

export interface SearchStudentsResult {
  students: StudentOption[]
  error?: string
}

export async function searchStudents(query: string): Promise<SearchStudentsResult> {
  try {
    await requireStaff()

    if (!query || query.length < 2) return { students: [] }

    const users = await prismaUnfiltered.user.findMany({
      where: {
        role: { in: [UserRole.STUDENT, UserRole.APPLICANT] },
        OR: [
          { email: { contains: query, mode: 'insensitive' } },
          { profile: { firstName: { contains: query, mode: 'insensitive' } } },
          { profile: { lastName: { contains: query, mode: 'insensitive' } } },
          { studentProfile: { studentId: { contains: query, mode: 'insensitive' } } },
        ],
      },
      include: {
        profile: { select: { firstName: true, lastName: true } },
        studentProfile: { select: { studentId: true } },
      },
      take: 10,
    })

    return {
      students: users.map((u) => ({
        id: u.id,
        email: u.email,
        firstName: u.profile?.firstName || '',
        lastName: u.profile?.lastName || '',
        studentId: u.studentProfile?.studentId || '',
      })),
    }
  } catch (error) {
    return {
      students: [],
      error: handleActionError('searchStudents', error, 'Failed to search students.'),
    }
  }
}

const fetchAvailableModules = unstable_cache(
  async (): Promise<ModuleOption[]> => {
    const [courses, components] = await Promise.all([
      prismaUnfiltered.course.findMany({
        select: { id: true, code: true, name: true },
        orderBy: { code: 'asc' },
      }),
      prismaUnfiltered.examComponent.findMany({
        select: {
          id: true,
          code: true,
          name: true,
          type: true,
          courseId: true,
          course: { select: { code: true, name: true } },
        },
        orderBy: { code: 'asc' },
      }),
    ])

    const courseOptions = courses.map((c) => ({
      id: c.id,
      courseId: c.id,
      code: c.code,
      name: `${c.code}: ${c.name} (General)`,
      moduleCode: c.code,
      isComponent: false,
    }))

    const componentOptions = components.map((c) => ({
      id: c.id,
      courseId: c.courseId,
      code: c.code,
      name: `${c.course.code}: ${c.name} (${c.type})`,
      moduleCode: c.course.code,
      isComponent: true,
    }))

    return [...courseOptions, ...componentOptions].sort((a, b) => a.code.localeCompare(b.code))
  },
  ['available-modules'],
  { revalidate: 300, tags: ['available-modules'] }
)

export async function getAvailableModules(): Promise<ModuleOption[]> {
  try {
    await requireStaff()
    return await fetchAvailableModules()
  } catch (error) {
    handleActionError('getAvailableModules', error, 'Failed to load modules.')
    throw error
  }
}
