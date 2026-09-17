import { NextRequest } from 'next/server'
import { requireStaff, getClientIp } from '@/lib/auth/helpers'
import {
  apiSuccess, apiError, withErrorHandler, apiCreated, parsePagination } from '@/lib/api/response'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { z } from 'zod'
import { validateBody } from '@/lib/validation/schemas'
import { createAuditLog, AuditAction } from '@/lib/audit/logger'

const createExamSchema = z.object({
  name: z.string().min(1),
  examComponentId: z.string(),
  eventId: z.string().optional(),
  description: z.string().optional(),
  examDate: z.string().datetime(),
  duration: z.number().int().positive(),
  passingScore: z.number().positive(),
})

/**
 * GET /api/exams — list exams
 */
export const GET = withErrorHandler(async (req: NextRequest) => {
  await requireStaff()
  const { page, limit, skip } = parsePagination(req.nextUrl.searchParams)

  const [exams, total] = await Promise.all([
    prismaUnfiltered.exam.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        examDate: true,
        duration: true,
        passingScore: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prismaUnfiltered.exam.count(),
  ])

  return apiSuccess({
    exams,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  })
})

/**
 * POST /api/exams — create exam
 */
export const POST = withErrorHandler(async (req: NextRequest) => {
  const staff = await requireStaff()
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return apiError('Invalid JSON body', 400)
  }
  const result = validateBody(createExamSchema, body)
  if (!result.success) return apiError(result.error || 'Invalid input', 400)
  const data = result.data

  const exam = await prismaUnfiltered.exam.create({
    data: {
      name: data.name,
      examComponentId: data.examComponentId,
      eventId: data.eventId || null,
      description: data.description || null,
      examDate: new Date(data.examDate),
      duration: data.duration,
      passingScore: data.passingScore,
    },
  })

  await createAuditLog({
    action: AuditAction.EXAM_CREATED,
    entity: 'Exam',
    entityId: exam.id,
    userId: staff.id,
    description: `Created exam "${exam.name}" scheduled for ${exam.examDate.toISOString()}`,
    details: {
      name: exam.name,
      examComponentId: exam.examComponentId,
      eventId: exam.eventId,
      examDate: exam.examDate.toISOString(),
      duration: exam.duration,
      passingScore: exam.passingScore.toString(),
    },
    ipAddress: getClientIp(req),
    userAgent: req.headers.get('user-agent') ?? undefined,
  })

  return apiCreated(exam)
})
