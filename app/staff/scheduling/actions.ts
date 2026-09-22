'use server'

import { Prisma } from '@prisma/client'
import type { TuitionRunStatus } from '@prisma/client'
import { requireStaff } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { AuditAction, createAuditLog } from '@/lib/audit/logger'
import { logActionError } from '@/lib/student/error-handler'
import { getRequestContext } from '@/lib/server/request-context'
import { serializePrisma } from '@/lib/utils/serialization'

// ---------------------------------------------------------------------------
// Discriminated action result types
// ---------------------------------------------------------------------------

export type SchedulingActionError = {
  error: string
  code: string
  details?: string
  serverDiagnostic?: string
}

export type SchedulingActionSuccess<T> = {
  success: true
  data: T
}

export type SchedulingActionResult<T> = SchedulingActionSuccess<T> | SchedulingActionError

const ERROR_CODES = {
  VALIDATION: 'VALIDATION',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  FORBIDDEN: 'FORBIDDEN',
  INTERNAL: 'INTERNAL',
} as const

type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES]

function serverDiagnostic(context: string, error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)
  return `[${context}] ${message}`
}

function actionError(code: ErrorCode, message: string, details?: string): SchedulingActionError {
  return { error: message, code, details }
}

function toActionError(context: string, error: unknown, fallback: string): SchedulingActionError {
  logActionError({ action: context }, error)
  return {
    error: fallback,
    code: ERROR_CODES.INTERNAL,
    serverDiagnostic: serverDiagnostic(context, error),
  }
}

const tuitionRunSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  moduleTag: z.string().max(50).optional(),
  description: z.string().max(2000).optional(),
  startDatetime: z.string().datetime(),
  endDatetime: z.string().datetime(),
  capacity: z.number().int().positive('Capacity must be positive'),
  minClassSize: z.number().int().positive('Minimum class size must be positive'),
  price: z.number().nonnegative('Price must be non-negative'),
})

const updateTuitionRunSchema = tuitionRunSchema.extend({
  status: z.enum(['OPEN', 'SCHEDULED', 'CANCELLED', 'COMPLETED'] as const),
})

/**
 * Assigns or unassigns a course to an academic term for a specific study pathway.
 */
export async function toggleCourseAssignment(
  termId: string,
  courseId: string,
  assigned: boolean
): Promise<SchedulingActionResult<null>> {
  const context = 'toggleCourseAssignment'
  try {
    const session = await requireStaff()

    if (assigned) {
      await prismaUnfiltered.termCourseAssignment.create({
        data: { termId, courseId },
      })
    } else {
      await prismaUnfiltered.termCourseAssignment.deleteMany({
        where: { termId, courseId },
      })
    }

    await createAuditLog({
      action: assigned ? AuditAction.CREATE : AuditAction.DELETE,
      entity: 'TermCourseAssignment',
      entityId: `${termId}:${courseId}`,
      userId: session.id,
      description: assigned
        ? `Assigned course ${courseId} to term ${termId}.`
        : `Removed course ${courseId} from term ${termId}.`,
      changes: { termId, courseId, assigned },
    })

    revalidatePath('/staff/scheduling')
    return { success: true, data: null }
  } catch (error) {
    return toActionError(context, error, 'Failed to update assignment.')
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
): Promise<SchedulingActionResult<{ id: string }>> {
  const context = 'createAcademicTerm'
  try {
    const session = await requireStaff()

    if (!Number.isInteger(yearNumber) || yearNumber < 1 || yearNumber > 99) {
      return actionError(
        ERROR_CODES.VALIDATION,
        'Year number must be an integer between 1 and 99.',
        `yearNumber=${yearNumber}`
      )
    }
    if (!Number.isInteger(semesterNumber) || semesterNumber < 1 || semesterNumber > 12) {
      return actionError(
        ERROR_CODES.VALIDATION,
        'Semester number must be an integer between 1 and 12.',
        `semesterNumber=${semesterNumber}`
      )
    }

    const term = await prismaUnfiltered.academicTerm.create({
      data: {
        pathwayId,
        yearNumber,
        semesterNumber,
        licenseCategoryId: licenseCategoryId || null,
      },
      select: { id: true },
    })

    await createAuditLog({
      action: AuditAction.CREATE,
      entity: 'AcademicTerm',
      entityId: term.id,
      userId: session.id,
      description: `Created academic term Year ${yearNumber} Semester ${semesterNumber} for pathway ${pathwayId}.`,
      changes: {
        pathwayId,
        yearNumber,
        semesterNumber,
        licenseCategoryId: licenseCategoryId ?? null,
      },
    })

    revalidatePath('/staff/scheduling')
    return { success: true, data: { id: term.id } }
  } catch (error) {
    return toActionError(context, error, 'Failed to create term.')
  }
}

/**
 * Ensures all required academic terms exist for a given pathway + license category combination.
 * Creates any missing terms based on the programme's year configuration.
 * Race-safe: runs inside a transaction and uses createMany skipDuplicates.
 */
export async function ensureTermsForPathwayLicense(
  pathwayId: string,
  licenseCategoryId: string,
  totalYears: number,
  semestersPerYear: number = 2
): Promise<
  SchedulingActionResult<{
    created: number
    terms: { id: string; yearNumber: number; semesterNumber: number }[]
  }>
> {
  const context = 'ensureTermsForPathwayLicense'
  try {
    const session = await requireStaff()

    if (!Number.isInteger(totalYears) || totalYears < 1 || totalYears > 20) {
      return actionError(
        ERROR_CODES.VALIDATION,
        'Total years must be an integer between 1 and 20.',
        `totalYears=${totalYears}`
      )
    }
    if (!Number.isInteger(semestersPerYear) || semestersPerYear < 1 || semestersPerYear > 4) {
      return actionError(
        ERROR_CODES.VALIDATION,
        'Semesters per year must be an integer between 1 and 4.',
        `semestersPerYear=${semestersPerYear}`
      )
    }

    const years = Array.from({ length: totalYears }, (_, i) => i + 1)
    const semesters = Array.from({ length: semestersPerYear }, (_, i) => i + 1)

    const toCreate: Prisma.AcademicTermCreateManyInput[] = []
    for (const year of years) {
      for (const sem of semesters) {
        toCreate.push({ pathwayId, yearNumber: year, semesterNumber: sem, licenseCategoryId })
      }
    }

    const result = await prismaUnfiltered.$transaction(async (tx) => {
      const created = await tx.academicTerm.createMany({
        data: toCreate,
        skipDuplicates: true,
      })

      const terms = await tx.academicTerm.findMany({
        where: {
          pathwayId,
          licenseCategoryId,
          yearNumber: { in: years },
          semesterNumber: { in: semesters },
        },
        select: { id: true, yearNumber: true, semesterNumber: true },
        orderBy: [{ yearNumber: 'asc' }, { semesterNumber: 'asc' }],
      })

      return { created: created.count, terms }
    })

    await createAuditLog({
      action: AuditAction.CREATE,
      entity: 'AcademicTerm',
      entityId: `bulk:${pathwayId}:${licenseCategoryId}`,
      userId: session.id,
      description: `Ensured ${result.created} new terms for pathway ${pathwayId} / license ${licenseCategoryId} (${totalYears}y).`,
      changes: {
        pathwayId,
        licenseCategoryId,
        totalYears,
        semestersPerYear,
        created: result.created,
        totalFound: result.terms.length,
      },
    })

    revalidatePath('/staff/scheduling')
    return {
      success: true,
      data: {
        created: result.created,
        terms: serializePrisma(result.terms),
      },
    }
  } catch (error) {
    return toActionError(context, error, 'Failed to ensure terms.')
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
}): Promise<SchedulingActionResult<{ id: string }>> {
  const context = 'createTuitionRun'
  try {
    const session = await requireStaff()

    const validation = tuitionRunSchema.safeParse({
      ...data,
      startDatetime: data.startDatetime.toISOString(),
      endDatetime: data.endDatetime.toISOString(),
    })

    if (!validation.success) {
      return actionError(
        ERROR_CODES.VALIDATION,
        validation.error.issues.map((e) => e.message).join(', ')
      )
    }

    if (!Number.isFinite(data.price)) {
      return actionError(
        ERROR_CODES.VALIDATION,
        'Price must be a finite number.',
        `price=${data.price}`
      )
    }
    if (data.price < 0) {
      return actionError(
        ERROR_CODES.VALIDATION,
        'Price must be non-negative.',
        `price=${data.price}`
      )
    }
    if (data.endDatetime <= data.startDatetime) {
      return actionError(
        ERROR_CODES.VALIDATION,
        'End date/time must be after start date/time.',
        `start=${data.startDatetime.toISOString()}, end=${data.endDatetime.toISOString()}`
      )
    }
    if (validation.data.minClassSize > validation.data.capacity) {
      return actionError(
        ERROR_CODES.VALIDATION,
        'Minimum class size cannot exceed maximum capacity',
        `min=${validation.data.minClassSize}, capacity=${validation.data.capacity}`
      )
    }

    const run = await prismaUnfiltered.tuitionRun.create({
      data: {
        title: validation.data.title,
        moduleTag: validation.data.moduleTag,
        description: validation.data.description,
        startDatetime: new Date(validation.data.startDatetime),
        endDatetime: new Date(validation.data.endDatetime),
        capacity: validation.data.capacity,
        minClassSize: validation.data.minClassSize,
        price: validation.data.price,
        createdById: session.id,
      },
      select: { id: true },
    })

    await createAuditLog({
      action: AuditAction.CREATE,
      entity: 'TuitionRun',
      entityId: run.id,
      userId: session.id,
      description: `Created revision tuition run "${validation.data.title}".`,
      changes: {
        title: validation.data.title,
        moduleTag: validation.data.moduleTag,
        capacity: validation.data.capacity,
        minClassSize: validation.data.minClassSize,
        price: validation.data.price,
      },
    })

    revalidatePath('/staff/revision-runs')
    revalidatePath('/student/courses/revision')
    return { success: true, data: { id: run.id } }
  } catch (error) {
    return toActionError(context, error, 'Failed to create revision run.')
  }
}

/**
 * Updates an existing Revision Support tuition run.
 */
export async function updateTuitionRun(
  runId: string,
  data: {
    title: string
    moduleTag?: string
    description?: string
    startDatetime: Date
    endDatetime: Date
    capacity: number
    minClassSize: number
    price: number
    status: TuitionRunStatus
  }
): Promise<SchedulingActionResult<{ id: string }>> {
  const context = 'updateTuitionRun'
  try {
    const session = await requireStaff()

    const validation = updateTuitionRunSchema.safeParse({
      ...data,
      startDatetime: data.startDatetime.toISOString(),
      endDatetime: data.endDatetime.toISOString(),
    })

    if (!validation.success) {
      return actionError(
        ERROR_CODES.VALIDATION,
        validation.error.issues.map((e) => e.message).join(', ')
      )
    }

    if (!Number.isFinite(data.price)) {
      return actionError(
        ERROR_CODES.VALIDATION,
        'Price must be a finite number.',
        `price=${data.price}`
      )
    }
    if (data.price < 0) {
      return actionError(
        ERROR_CODES.VALIDATION,
        'Price must be non-negative.',
        `price=${data.price}`
      )
    }
    if (data.endDatetime <= data.startDatetime) {
      return actionError(
        ERROR_CODES.VALIDATION,
        'End date/time must be after start date/time.',
        `start=${data.startDatetime.toISOString()}, end=${data.endDatetime.toISOString()}`
      )
    }
    if (validation.data.minClassSize > validation.data.capacity) {
      return actionError(
        ERROR_CODES.VALIDATION,
        'Minimum class size cannot exceed maximum capacity',
        `min=${validation.data.minClassSize}, capacity=${validation.data.capacity}`
      )
    }

    const run = await prismaUnfiltered.tuitionRun.update({
      where: { id: runId },
      data: {
        title: validation.data.title,
        moduleTag: validation.data.moduleTag,
        description: validation.data.description,
        startDatetime: new Date(validation.data.startDatetime),
        endDatetime: new Date(validation.data.endDatetime),
        capacity: validation.data.capacity,
        minClassSize: validation.data.minClassSize,
        price: validation.data.price,
        status: validation.data.status,
      },
      select: { id: true },
    })

    await createAuditLog({
      action: AuditAction.UPDATE,
      entity: 'TuitionRun',
      entityId: run.id,
      userId: session.id,
      description: `Updated revision tuition run "${validation.data.title}" (status: ${validation.data.status}).`,
      changes: {
        title: validation.data.title,
        moduleTag: validation.data.moduleTag,
        capacity: validation.data.capacity,
        minClassSize: validation.data.minClassSize,
        price: validation.data.price,
        status: validation.data.status,
      },
    })

    revalidatePath('/staff/revision-runs')
    revalidatePath('/student/courses/revision')
    return { success: true, data: { id: run.id } }
  } catch (error) {
    return toActionError(context, error, 'Failed to update revision run.')
  }
}

/**
 * Deletes a Revision Support tuition run.
 */
export async function deleteTuitionRun(runId: string): Promise<SchedulingActionResult<null>> {
  const context = 'deleteTuitionRun'
  try {
    const session = await requireStaff()
    const requestContext = await getRequestContext()

    const run = await prismaUnfiltered.tuitionRun.findUnique({
      where: { id: runId },
      select: {
        id: true,
        title: true,
        moduleTag: true,
        capacity: true,
        minClassSize: true,
        price: true,
        status: true,
      },
    })

    if (!run) {
      return actionError(ERROR_CODES.NOT_FOUND, 'Revision run not found.', `runId=${runId}`)
    }

    await prismaUnfiltered.$transaction(async (tx) => {
      await tx.tuitionBooking.deleteMany({
        where: { tuitionRunId: runId },
      })
      await tx.tuitionRun.delete({
        where: { id: runId },
      })
    })

    await createAuditLog({
      action: AuditAction.DELETE,
      entity: 'TuitionRun',
      entityId: run.id,
      userId: session.id,
      description: `Deleted revision tuition run "${run.title}".`,
      changes: {
        title: run.title,
        moduleTag: run.moduleTag,
        capacity: run.capacity,
        minClassSize: run.minClassSize,
        price: run.price,
        status: run.status,
      },
      ipAddress: requestContext.ipAddress,
      userAgent: requestContext.userAgent,
    })

    revalidatePath('/staff/revision-runs')
    revalidatePath('/student/courses/revision')
    return { success: true, data: null }
  } catch (error) {
    return toActionError(context, error, 'Failed to delete revision run.')
  }
}
