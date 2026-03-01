'use server'

import { requireStaff } from '@/lib/auth/helpers'
import prisma from '@/lib/prisma/client'
import { revalidatePath } from 'next/cache'

/**
 * Assigns or unassigns a course to an academic term for a specific study pathway.
 */
export async function toggleCourseAssignment(termId: string, courseId: string, assigned: boolean) {
  try {
    await requireStaff()

    if (assigned) {
      await prisma.termCourseAssignment.upsert({
        where: { termId_courseId: { termId, courseId } },
        update: {},
        create: { termId, courseId },
      })
    } else {
      await prisma.termCourseAssignment.deleteMany({
        where: { termId, courseId },
      })
    }

    revalidatePath('/staff/scheduling')
    return { success: true }
  } catch (error) {
    console.error('Toggle course assignment error:', error)
    return { error: 'Failed to update assignment.' }
  }
}

/**
 * Creates a new academic term for a pathway.
 */
export async function createAcademicTerm(
  pathwayId: string,
  yearNumber: number,
  semesterNumber: number
) {
  try {
    await requireStaff()

    await prisma.academicTerm.create({
      data: {
        pathwayId,
        yearNumber,
        semesterNumber,
      },
    })

    revalidatePath('/staff/scheduling')
    return { success: true }
  } catch (error) {
    console.error('Create academic term error:', error)
    return { error: 'Failed to create term.' }
  }
}
