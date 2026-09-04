import { NextRequest } from 'next/server'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, withErrorHandler } from '@/lib/api/response'

// GET /api/staff/admissions/aptitude/sessions
export const GET = withErrorHandler(async (req: NextRequest) => {
  await requireStaff()

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  
  const where = status ? { status: status as any } : {}

  const sessions = await prismaUnfiltered.aptitudeTestSession.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      user: { select: { id: true, firstName: true, lastName: true, email: true } },
      bank: { select: { name: true } },
    },
  })

  return apiSuccess(sessions)
})
