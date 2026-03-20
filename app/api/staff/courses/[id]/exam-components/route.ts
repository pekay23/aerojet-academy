import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiError, apiCreated, withErrorHandler } from '@/lib/api/response'
import { createAuditLog, AuditAction } from '@/lib/audit/logger'

// GET /api/staff/courses/[id]/exam-components
export const GET = withErrorHandler(
  async (req: NextRequest, context?: { params: Record<string, string> }) => {
    await requireStaff()
    const courseId = context?.params?.id
    if (!courseId) return apiError('Course ID required')

    const components = await prisma.examComponent.findMany({
      where: { courseId },
      include: {
        _count: { select: { exams: true, bookings: true } },
      },
      orderBy: { code: 'asc' },
    })

    return apiSuccess(components)
  }
)

// POST /api/staff/courses/[id]/exam-components
export const POST = withErrorHandler(
  async (req: NextRequest, context?: { params: Record<string, string> }) => {
    const staff = await requireStaff()
    const courseId = context?.params?.id
    if (!courseId) return apiError('Course ID required')

    const body = await req.json()
    const { code, name, type, duration, individualPrice, poolPrice, questionCount, categoryCode } = body

    if (!code || !name || !type || !duration) {
      return apiError('Code, name, type, and duration are required')
    }

    if (!['MCQ', 'ESSAY'].includes(type)) {
      return apiError('Type must be MCQ or ESSAY')
    }

    const course = await prisma.course.findUnique({ where: { id: courseId } })
    if (!course) return apiError('Course not found', 404)

    const existing = await prisma.examComponent.findUnique({ where: { code } })
    if (existing) return apiError(`Exam component with code "${code}" already exists`)

    const component = await prisma.examComponent.create({
      data: {
        courseId,
        code,
        name,
        type,
        duration: parseInt(duration),
        individualPrice: individualPrice ?? 520,
        poolPrice: poolPrice ?? 300,
        ...(questionCount !== undefined && { questionCount: questionCount ? parseInt(questionCount) : null }),
        ...(categoryCode !== undefined && { categoryCode: categoryCode || null }),
      },
    })

    await createAuditLog({
      action: AuditAction.CREATE,
      entity: 'ExamComponent',
      entityId: component.id,
      userId: staff.id,
      details: { courseId, code, type },
    })

    return apiCreated(component)
  }
)
