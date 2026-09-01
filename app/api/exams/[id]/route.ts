import { NextRequest } from 'next/server'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiError, withErrorHandler, validateBody, apiCreated } from '@/lib/api/response'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { z } from 'zod'

const updateExamSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  examDate: z.string().datetime().optional(),
  duration: z.number().int().positive().optional(),
  passingScore: z.number().positive().optional(),
  eventId: z.string().optional(),
  examComponentId: z.string().optional(),
})

export const GET = withErrorHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const session = await requireStaff()
  const exam = await prismaUnfiltered.exam.findUnique({
    where: { id: params.id },
    include: {
      event: true,
      examComponent: true,
    },
  })

  if (!exam) return apiError('Exam not found', 404)

  return apiSuccess(exam)
})

export const PUT = withErrorHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const session = await requireStaff()
  const data = await validateBody(req, updateExamSchema)

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

  return apiSuccess(exam)
})

export const DELETE = withErrorHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const session = await requireStaff()

  await prismaUnfiltered.exam.delete({
    where: { id: params.id },
  })

  return apiSuccess({ deleted: true })
})
