import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { requireAuth } from '@/lib/auth/helpers'
import {
  apiSuccess,
  apiForbidden,
  apiNotFound,
  apiError,
  withErrorHandler,
} from '@/lib/api/response'
import { enterGradeSchema, validateBody } from '@/lib/validation/schemas'
import { createAuditLog, AuditAction } from '@/lib/audit/logger'
import { UserRole } from '@prisma/client'

export const GET = withErrorHandler(
  async (req: NextRequest, ctx?: { params: Record<string, string> }) => {
    const user = await requireAuth()
    if (user.role !== UserRole.INSTRUCTOR) return apiForbidden('Instructor access required')

    const classItem = await prisma.class.findUnique({
      where: { id: ctx?.params?.id },
      include: { course: true },
    })
    if (!classItem) return apiNotFound('Class not found')
    if (classItem.instructorId !== user.id) return apiForbidden('Not assigned to this class')

    // Get enrollments and their grades for this course
    const enrollments = await prisma.enrollment.findMany({
      where: { courseId: classItem.courseId, status: 'ENROLLED' },
      include: {
        user: { include: { profile: { select: { firstName: true, lastName: true } } } },
        grades: { orderBy: { createdAt: 'desc' } },
      },
    })

    return apiSuccess({ class: classItem, enrollments })
  }
)

export const POST = withErrorHandler(
  async (req: NextRequest, ctx?: { params: Record<string, string> }) => {
    const user = await requireAuth()
    if (user.role !== UserRole.INSTRUCTOR) return apiForbidden('Instructor access required')

    const classId = ctx?.params?.id
    if (!classId) return apiError('Class ID required')

    const classItem = await prisma.class.findUnique({
      where: { id: classId },
      include: { course: true },
    })
    if (!classItem) return apiNotFound('Class not found')
    if (classItem.instructorId !== user.id) return apiForbidden('Not assigned to this class')

    const body = await req.json()
    const validation = validateBody(enterGradeSchema, body)
    if (!validation.success) return apiError(validation.error)

    const { grades, type, title } = validation.data

    const results = await Promise.all(
      grades.map(
        async (g: {
          userId: string
          score: number
          maxScore: number
          mcqScore?: number
          essay1Score?: number
          essay2Score?: number
          feedback?: string
        }) => {
          // Verify enrollment exists for user
          const enrollment = await prisma.enrollment.findFirst({
            where: { userId: g.userId, courseId: classItem.courseId },
          })
          if (!enrollment) {
            throw new Error(`Enrollment not found for student ${g.userId}`)
          }

          const percentage = g.maxScore > 0 ? (g.score / g.maxScore) * 100 : 0

          return prisma.grade.create({
            data: {
              enrollmentId: enrollment.id,
              userId: g.userId,
              score: g.score,
              maxScore: g.maxScore,
              assessmentType: type || 'ASSIGNMENT',
              assessmentName: title || 'Assessment',
              percentage,
              assessmentDate: new Date(),
              gradedBy: user.id,
              comments: g.feedback || null,
              mcqScore: g.mcqScore !== undefined ? g.mcqScore : null,
              essay1Score: g.essay1Score !== undefined ? g.essay1Score : null,
              essay2Score: g.essay2Score !== undefined ? g.essay2Score : null,
            },
          })
        }
      )
    )

    await createAuditLog({
      action: AuditAction.CREATE,
      entity: 'Grade',
      entityId: classId,
      userId: user.id,
      details: { courseId: classItem.courseId, gradesEntered: results.length },
    })

    return apiSuccess({
      message: `${results.length} grades recorded`,
      grades: results,
    })
  }
)
