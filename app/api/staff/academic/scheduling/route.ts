import { NextRequest } from 'next/server'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiError, apiCreated, withErrorHandler } from '@/lib/api/response'
import { createAuditLog, AuditAction } from '@/lib/audit/logger'

// GET /api/staff/academic/scheduling
// Fetch all pathways with their terms and course assignments
export const GET = withErrorHandler(async (_req: NextRequest) => {
  await requireStaff()

  const [pathways, licenseCategories] = await Promise.all([
    prismaUnfiltered.studyPathwayModel.findMany({
      include: {
        academicTerms: {
          orderBy: [{ yearNumber: 'asc' }, { semesterNumber: 'asc' }],
          include: {
            courseAssignments: {
              include: {
                course: {
                  select: { id: true, code: true, name: true },
                },
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    }),
    prismaUnfiltered.licenseCategory.findMany({
      orderBy: { code: 'asc' },
    }),
  ])

  return apiSuccess({ pathways, licenseCategories })
})

// POST /api/staff/academic/scheduling
// Create or update term course assignments
export const POST = withErrorHandler(async (req: NextRequest) => {
  const staff = await requireStaff()
  const body = await req.json()

  const { termId, courseId, pathwayId, yearNumber, semesterNumber } = body

  if (!courseId) {
    return apiError('courseId is required')
  }

  let resolvedTermId = termId

  // If no termId provided, create the term from pathwayId/yearNumber/semesterNumber
  if (!resolvedTermId) {
    if (!pathwayId || yearNumber == null || semesterNumber == null) {
      return apiError('Either termId or pathwayId + yearNumber + semesterNumber is required')
    }

    // Check pathway exists
    const pathway = await prismaUnfiltered.studyPathwayModel.findUnique({
      where: { id: pathwayId },
    })
    if (!pathway) {
      return apiError('Pathway not found', 404)
    }

    // Find or create the term
    const existingTerm = await prismaUnfiltered.academicTerm.findFirst({
      where: { pathwayId, yearNumber, semesterNumber },
    })

    if (existingTerm) {
      resolvedTermId = existingTerm.id
    } else {
      const newTerm = await prismaUnfiltered.academicTerm.create({
        data: { pathwayId, yearNumber, semesterNumber },
      })
      resolvedTermId = newTerm.id
    }
  } else {
    // Verify term exists
    const term = await prismaUnfiltered.academicTerm.findUnique({
      where: { id: resolvedTermId },
    })
    if (!term) {
      return apiError('Term not found', 404)
    }
  }

  // Verify course exists
  const course = await prismaUnfiltered.course.findUnique({
    where: { id: courseId },
  })
  if (!course) {
    return apiError('Course not found', 404)
  }

  // Upsert: skip if assignment already exists
  const existing = await prismaUnfiltered.termCourseAssignment.findUnique({
    where: { termId_courseId: { termId: resolvedTermId, courseId } },
  })

  if (existing) {
    return apiSuccess(existing)
  }

  const assignment = await prismaUnfiltered.termCourseAssignment.create({
    data: { termId: resolvedTermId, courseId },
    include: {
      course: { select: { id: true, code: true, name: true } },
      term: true,
    },
  })

  // Resolve term label for audit log
  const term = await prismaUnfiltered.academicTerm.findUnique({
    where: { id: resolvedTermId },
    select: { yearNumber: true, semesterNumber: true, pathway: { select: { name: true } } },
  })
  const termLabel = term
    ? `${term.pathway.name} - Year ${term.yearNumber} Semester ${term.semesterNumber}`
    : resolvedTermId

  await createAuditLog({
    action: AuditAction.CREATE,
    entity: 'TermCourseAssignment',
    entityId: assignment.id,
    userId: staff.id,
    description: `Assigned course ${course.code} to term ${termLabel}`,
    details: { termId: resolvedTermId, courseId, courseCode: course.code },
  })

  return apiCreated(assignment)
})

// DELETE /api/staff/academic/scheduling
// Remove a course assignment from a term
export const DELETE = withErrorHandler(async (req: NextRequest) => {
  const staff = await requireStaff()

  const { searchParams } = new URL(req.url)

  // Support both query params and JSON body
  let assignmentId = searchParams.get('assignmentId')
  let termId = searchParams.get('termId')
  let courseId = searchParams.get('courseId')

  if (!assignmentId && !termId) {
    try {
      const body = await req.json()
      assignmentId = body.assignmentId || null
      termId = body.termId || null
      courseId = body.courseId || null
    } catch {
      // No body provided
    }
  }

  let assignment: {
    id: string
    termId: string
    courseId: string
    course: { id: string; code: string; name: string }
    term: { yearNumber: number; semesterNumber: number; pathway: { name: string } } | null
  } | null

  if (assignmentId) {
    assignment = await prismaUnfiltered.termCourseAssignment.findUnique({
      where: { id: assignmentId },
      include: {
        course: { select: { id: true, code: true, name: true } },
        term: {
          select: { yearNumber: true, semesterNumber: true, pathway: { select: { name: true } } },
        },
      },
    })
  } else if (termId && courseId) {
    assignment = await prismaUnfiltered.termCourseAssignment.findUnique({
      where: { termId_courseId: { termId, courseId } },
      include: {
        course: { select: { id: true, code: true, name: true } },
        term: {
          select: { yearNumber: true, semesterNumber: true, pathway: { select: { name: true } } },
        },
      },
    })
  } else {
    return apiError('Either assignmentId or termId + courseId is required')
  }

  if (!assignment) {
    return apiError('Assignment not found', 404)
  }

  await prismaUnfiltered.termCourseAssignment.delete({
    where: { id: assignment.id },
  })

  await createAuditLog({
    action: AuditAction.DELETE,
    entity: 'TermCourseAssignment',
    entityId: assignment.id,
    userId: staff.id,
    description: `Removed course ${assignment.course.code} from term ${assignment.term ? `${assignment.term.pathway.name} - Year ${assignment.term.yearNumber} Semester ${assignment.term.semesterNumber}` : assignment.termId}`,
    details: {
      termId: assignment.termId,
      courseId: assignment.courseId,
      courseCode: assignment.course.code,
    },
  })

  return apiSuccess({ deleted: true, id: assignment.id })
})
