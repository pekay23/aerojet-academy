import { NextRequest } from 'next/server'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiError, withErrorHandler, apiCreated } from '@/lib/api/response'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { z } from 'zod'
import { validateBody } from '@/lib/validation/schemas'

const createSessionSchema = z.object({
  examId: z.string(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  location: z.string().optional(),
  invigilatorId: z.string().optional(),
  accessCodeCount: z.number().int().min(1).max(100).optional(),
})

export const GET = withErrorHandler(
  async (req: NextRequest, { params }: { params: { id: string } }) => {
    const session = await requireStaff()
    const url = new URL(req.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '20')

    const [attendances, total] = await Promise.all([
      prismaUnfiltered.examAttendance.findMany({
        where: { examId: params.id },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              profile: { select: { firstName: true, lastName: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prismaUnfiltered.examAttendance.count({ where: { examId: params.id } }),
    ])

    return apiSuccess({
      sessions: attendances,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  }
)

export const POST = withErrorHandler(
  async (req: NextRequest, { params }: { params: { id: string } }) => {
    const session = await requireStaff()
    const body = await req.json()
    const result = validateBody(createSessionSchema, body)
    if (!result.success) return apiError(result.error || 'Invalid input', 400)
    const data = result.data

    const exam = await prismaUnfiltered.exam.findUnique({
      where: { id: params.id },
    })

    if (!exam) return apiError('Exam not found', 404)

    const attendance = await prismaUnfiltered.examAttendance.create({
      data: {
        examId: params.id,
        userId: '',
        attendanceDate: new Date(),
        status: 'PRESENT',
      } as any,
    })

    return apiCreated(attendance)
  }
)

function generateAccessCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const segments = [8, 8, 8, 8]
  return segments
    .map((seg) => {
      let code = ''
      for (let i = 0; i < seg; i++) {
        code += chars[Math.floor(Math.random() * chars.length)]
      }
      return code
    })
    .join('-')
}
