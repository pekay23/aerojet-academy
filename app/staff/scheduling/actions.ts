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
 * Creates a new academic term for a pathway, optionally scoped to a license category.
 */
export async function createAcademicTerm(
  pathwayId: string,
  yearNumber: number,
  semesterNumber: number,
  licenseCategoryId?: string | null
) {
  try {
    await requireStaff()

    await prisma.academicTerm.create({
      data: {
        pathwayId,
        yearNumber,
        semesterNumber,
        licenseCategoryId: licenseCategoryId || null,
      },
    })

    revalidatePath('/staff/scheduling')
    return { success: true }
  } catch (error) {
    console.error('Create academic term error:', error)
    return { error: 'Failed to create term.' }
  }
}

/**
 * Ensures all required academic terms exist for a given pathway + license category combination.
 * Creates any missing terms based on the programme's year configuration.
 * Returns the term IDs created or found.
 */
export async function ensureTermsForPathwayLicense(
  pathwayId: string,
  licenseCategoryId: string,
  totalYears: number,
  semestersPerYear: number = 2
) {
  try {
    await requireStaff()

    const terms = []
    for (let year = 1; year <= totalYears; year++) {
      for (let sem = 1; sem <= semestersPerYear; sem++) {
        // Try to find existing term
        let term = await prisma.academicTerm.findFirst({
          where: { pathwayId, yearNumber: year, semesterNumber: sem, licenseCategoryId },
        })
        if (!term) {
          term = await prisma.academicTerm.create({
            data: { pathwayId, yearNumber: year, semesterNumber: sem, licenseCategoryId },
          })
        }
        terms.push(term)
      }
    }

    revalidatePath('/staff/scheduling')
    return { success: true, terms }
  } catch (error) {
    console.error('Ensure terms error:', error)
    return { error: 'Failed to ensure terms.' }
  }
}

/**
 * Creates a new Revision Support tuition run.
 */
export async function createTuitionRun(data: {
  title: string
  moduleTag?: string
  description?: string
  startDatetime: Date
  endDatetime: Date
  capacity: number
  minClassSize: number
  price: number
}) {
  try {
    const session = await requireStaff()

    const run = await prisma.tuitionRun.create({
      data: {
        ...data,
        price: data.price,
        createdById: session.id,
      },
    })

    revalidatePath('/staff/revision-runs')
    revalidatePath('/student/courses/revision')
    return { success: true, run }
  } catch (error) {
    console.error('Create tuition run error:', error)
    return { error: 'Failed to create revision run.' }
  }
}

/**
 * Updates an existing Revision Support tuition run.
 */
export async function updateTuitionRun(runId: string, data: {
  title: string
  moduleTag?: string
  description?: string
  startDatetime: Date
  endDatetime: Date
  capacity: number
  minClassSize: number
  price: number
  status: string
}) {
  try {
    await requireStaff()

    const run = await prisma.tuitionRun.update({
      where: { id: runId },
      data: {
        ...data,
        price: data.price,
      },
    })

    revalidatePath('/staff/revision-runs')
    revalidatePath('/student/courses/revision')
    return { success: true, run }
  } catch (error) {
    console.error('Update tuition run error:', error)
    return { error: 'Failed to update revision run.' }
  }
}

/**
 * Deletes a Revision Support tuition run.
 */
export async function deleteTuitionRun(runId: string) {
  try {
    await requireStaff()

    // Also delete any existing bookings for the run if cascading isn't handled
    await prisma.tuitionBooking.deleteMany({
      where: { tuitionRunId: runId },
    })

    await prisma.tuitionRun.delete({
      where: { id: runId },
    })

    revalidatePath('/staff/revision-runs')
    revalidatePath('/student/courses/revision')
    return { success: true }
  } catch (error) {
    console.error('Delete tuition run error:', error)
    return { error: 'Failed to delete revision run.' }
  }
}
