import { NextRequest } from 'next/server'
import { requireStaff, getClientIp } from '@/lib/auth/helpers'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { z } from 'zod'
import { validateBody } from '@/lib/validation/schemas'
import { createAuditLog, AuditAction } from '@/lib/audit/logger'

const updateExamSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  examDate: z.string().datetime().optional(),
  duration: z.number().int().positive().optional(),
  passingScore: z.number().positive().optional(),
  eventId: z.string().optional(),
  examComponentId: z.string().optional(),
})

export const GET = withErrorHandler(
  async (req: NextRequest, { params }: { params: { id: string } }) => {
    await requireStaff()
    const exam = await prismaUnfiltered.exam.findUnique({
      where: { id: params.id },
      include: {
        event: true,
        examComponent: true,
      },
    })

    if (!exam) return apiError('Exam not found', 404)

    return apiSuccess(exam)
  }
)

export const PUT = withErrorHandler(
  async (req: NextRequest, { params }: { params: { id: string } }) => {
    const staff = await requireStaff()
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return apiError('Invalid JSON body', 400)
    }
    const result = validateBody(updateExamSchema, body)
    if (!result.success) return apiError(result.error || 'Invalid input', 400)
    const data = result.data

    const prior = await prismaUnfiltered.exam.findUnique({ where: { id: params.id } })
    if (!prior) return apiError('Exam not found', 404)

    const exam = await prismaUnfiltered.exam.update({
      where: { id: params.id },
      data: {
        name: data.name,
        description: data.description,
        examDate: data.examDate ? new Date(data.examDate) : undefined,
        duration: data.duration,
        passingScore: data.passingScore,
        eventId: data.eventId || null,
        examComponentId: data.examComponentId,
      },
    })

    const changedFields = Object.fromEntries(
      Object.entries(data).filter(([, v]) => v !== undefined)
    )

    await createAuditLog({
      action: AuditAction.EXAM_UPDATED,
      entity: 'Exam',
      entityId: exam.id,
      userId: staff.id,
      description: `Updated exam "${exam.name}"`,
      details: {
        changedFields,
        before: {
          name: prior.name,
          examDate: prior.examDate.toISOString(),
          duration: prior.duration,
          passingScore: prior.passingScore.toString(),
        },
        after: {
          name: exam.name,
          examDate: exam.examDate.toISOString(),
          duration: exam.duration,
          passingScore: exam.passingScore.toString(),
        },
      },
      ipAddress: getClientIp(req),
      userAgent: req.headers.get('user-agent') ?? undefined,
    })

    return apiSuccess(exam)
  }
)

export const DELETE = withErrorHandler(
  async (req: NextRequest, { params }: { params: { id: string } }) => {
    const staff = await requireStaff()

    if (!params.id) return apiError('Exam ID required', 400)

    const prior = await prismaUnfiltered.exam.findUnique({ where: { id: params.id } })
    if (!prior) return apiError('Exam not found', 404)

    await prismaUnfiltered.exam.delete({
      where: { id: params.id },
    })

    await createAuditLog({
      action: AuditAction.EXAM_DELETED,
      entity: 'Exam',
      entityId: prior.id,
      userId: staff.id,
      description: `Deleted exam "${prior.name}" scheduled for ${prior.examDate.toISOString()}`,
      details: {
        name: prior.name,
        examComponentId: prior.examComponentId,
        eventId: prior.eventId,
        examDate: prior.examDate.toISOString(),
        duration: prior.duration,
        passingScore: prior.passingScore.toString(),
      },
      ipAddress: getClientIp(req),
      userAgent: req.headers.get('user-agent') ?? undefined,
    })

    return apiSuccess({ deleted: true })
  }
)
