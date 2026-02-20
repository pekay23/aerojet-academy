import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { requireStudent } from '@/lib/auth/helpers'
import { apiSuccess, withErrorHandler } from '@/lib/api/response'

export const GET = withErrorHandler(async (req: NextRequest) => {
  const user = await requireStudent()
  const records = await prisma.attendanceRecord.findMany({
    where: { userId: user.id },
    include: { class: { include: { course: { select: { code: true, name: true } } } } },
    orderBy: { date: 'desc' },
  })

  const total = records.length
  const present = records.filter((r) => r.status === 'PRESENT').length
  const rate = total > 0 ? Math.round((present / total) * 100) : 0

  return apiSuccess({ records, summary: { total, present, absent: total - present, rate } })
})

