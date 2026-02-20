import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiNotFound, apiError, withErrorHandler } from '@/lib/api/response'

// GET /api/staff/students/[id]
export const GET = withErrorHandler(async (
  req: NextRequest,
  context?: { params: Record<string, string> }
) => {
  await requireStaff()
  const id = context?.params?.id
  if (!id) return apiError('Student ID required')

  const student = await prisma.user.findUnique({
    where: { id, role: 'STUDENT' },
    include: {
      profile: true,
      studentProfile: true,
      wallet: { include: { transactions: { orderBy: { createdAt: 'desc' }, take: 20 } } },
      enrollments: { include: { course: true, grades: true } },
      poolMemberships: { include: { pool: { include: { event: true } } } },
      attendanceRecords: { orderBy: { date: 'desc' }, take: 30 },
    },
  })

  if (!student) return apiNotFound('Student not found')

  const { password, ...safe } = student
  return apiSuccess(safe)
})
