import { NextRequest } from 'next/server'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'

// POST /api/staff/admissions/aptitude/sessions/[id]/void
export const POST = withErrorHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  await requireStaff()
  const { id } = await params

  const session = await prismaUnfiltered.aptitudeTestSession.findUnique({
    where: { id },
  })

  if (!session) return apiError('Session not found', 404)

  const updated = await prismaUnfiltered.aptitudeTestSession.update({
    where: { id },
    data: { status: 'VOIDED', passed: false },
  })

  // Additionally we could push the application stage back or record a flag in Application

  return apiSuccess(updated)
})
