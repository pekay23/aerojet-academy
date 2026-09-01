'use server'

import { requireStaff } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { UserRole } from '@prisma/client'
import { handleActionError } from '@/lib/staff/errors'

export async function searchStudents(query: string) {
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
    handleActionError('searchStudents', error, 'Failed to search students.')
    return { students: [] }
  }
}

export async function getAvailableModules() {
  try {
    await requireStaff()
    const courses = await prismaUnfiltered.course.findMany({
      select: { id: true, code: true, name: true },
      orderBy: { code: 'asc' },
    })
    const components = await prismaUnfiltered.examComponent.findMany({
      select: { 
        id: true, 
        code: true, 
        name: true, 
        type: true,
        courseId: true,
        course: { select: { code: true, name: true } }
      },
      orderBy: { code: 'asc' },
    })
    
    const courseOptions = courses.map(c => ({
      id: c.id,
      courseId: c.id,
      code: c.code,
      name: `${c.code}: ${c.name} (General)`,
      moduleCode: c.code,
      isComponent: false
    }))

    const componentOptions = components.map(c => ({
      id: c.id,
      courseId: c.courseId,
      code: c.code,
      name: `${c.course.code}: ${c.name} (${c.type})`,
      moduleCode: c.course.code,
      isComponent: true
    }))
    
    return [...courseOptions, ...componentOptions].sort((a, b) => a.code.localeCompare(b.code))
  } catch (error) {
    handleActionError('getAvailableModules', error, 'Failed to load modules.')
    return []
  }
}
