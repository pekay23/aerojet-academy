import { NextRequest } from 'next/server'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, withErrorHandler } from '@/lib/api/response'
import { Prisma } from '@prisma/client'

// GET /api/staff/admissions/aptitude/sessions
export const GET = withErrorHandler(async (req: NextRequest) => {
  await requireStaff()

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  
  const where: Prisma.AptitudeTestSessionWhereInput = {}
  if (status) where.status = status as 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'TIMED_OUT' | 'FLAGGED' | 'VOIDED'

  const sessions = await prismaUnfiltered.aptitudeTestSession.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      user: { select: { id: true, email: true } },
      bank: { select: { name: true } },
    },
  })

  return apiSuccess(sessions)
})
