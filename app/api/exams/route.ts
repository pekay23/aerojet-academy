import { NextRequest } from 'next/server'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiError, withErrorHandler, validateBody, apiCreated } from '@/lib/api/response'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { z } from 'zod'

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
  const session = await requireStaff()
  const url = new URL(req.url)
  const status = url.searchParams.get('status')
  const page = parseInt(url.searchParams.get('page') || '1')
  const limit = parseInt(url.searchParams.get('limit') || '20')

  const where: any = {}
  if (status) where.status = status

  const [exams, total] = await Promise.all([
    prismaUnfiltered.exam.findMany({
      where,
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
      skip: (page - 1) * limit,
      take: limit,
    }),
    prismaUnfiltered.exam.count({ where }),
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
  const session = await requireStaff()
  const data = await validateBody(req, createExamSchema)

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

  return apiCreated(exam)
})
