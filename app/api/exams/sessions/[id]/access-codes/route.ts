import { NextRequest } from 'next/server'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiError, withErrorHandler, apiCreated } from '@/lib/api/response'
import { prismaUnfiltered } from '@/lib/prisma/client'

export const GET = withErrorHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const url = new URL(req.url)
  const page = parseInt(url.searchParams.get('page') || '1')
  const limit = parseInt(url.searchParams.get('limit') || '50')

  const [bookings, total] = await Promise.all([
    prismaUnfiltered.examBooking.findMany({
      where: { examId: params.id },
      include: {
        user: { select: { id: true, email: true, profile: { select: { firstName: true, lastName: true } } } },
      },
      orderBy: { bookedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prismaUnfiltered.examBooking.count({ where: { examId: params.id } }),
  ])

  return apiSuccess({
    codes: bookings,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  })
})

export const POST = withErrorHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const session = await requireStaff()

  const body = await req.json()
  const count = Math.min(Math.max(body.count || 10, 1), 100)

  const exam = await prismaUnfiltered.exam.findUnique({
    where: { id: params.id },
  })

  if (!exam) return apiError('Exam not found', 404)

  const codes = await prismaUnfiltered.examBooking.createMany({
    data: Array.from({ length: count }, () => ({
      examId: params.id,
      userId: '',
      status: 'PENDING',
      amountPaid: 0,
    })),
  })

  return apiCreated({ generated: codes.count })
})

function generateAccessCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const segments = [8, 8, 8, 8]
  return segments.map(seg => {
    let code = ''
    for (let i = 0; i < seg; i++) {
      code += chars[Math.floor(Math.random() * chars.length)]
    }
    return code
  }).join('-')
}
