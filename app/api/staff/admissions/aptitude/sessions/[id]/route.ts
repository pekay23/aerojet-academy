import { NextRequest } from 'next/server'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'

// GET /api/staff/admissions/aptitude/sessions/[id]
export const GET = withErrorHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  await requireStaff()
  const { id } = await params

  const session = await prismaUnfiltered.aptitudeTestSession.findUnique({
    where: { id },
    include: {
      user: { select: { firstName: true, lastName: true, email: true } },
      answers: {
        include: {
          question: { select: { text: true, correctAnswer: true, category: true, points: true } }
        }
      }
    },
  })

  if (!session) return apiError('Session not found', 404)
  return apiSuccess(session)
})
