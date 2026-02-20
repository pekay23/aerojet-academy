import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { requireApplicant } from '@/lib/auth/helpers'
import { apiSuccess, apiNotFound, withErrorHandler } from '@/lib/api/response'

export const GET = withErrorHandler(async (req: NextRequest, ctx?: { params: Record<string, string> }) => {
  await requireApplicant()
  const course = await prisma.course.findUnique({ where: { id: ctx?.params?.id, isActive: true } })
  if (!course) return apiNotFound('Course not found')
  return apiSuccess(course)
})
