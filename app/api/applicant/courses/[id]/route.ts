import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { requireApplicant } from '@/lib/auth/helpers'
import { apiSuccess, apiNotFound, withErrorHandler , RouteContext } from '@/lib/api/response'

export const GET = withErrorHandler(async (req: NextRequest, ctx?: RouteContext) => {
  await requireApplicant()
  const course = await prisma.course.findUnique({ where: { id: (await ctx!.params).id, isActive: true } })
  if (!course) return apiNotFound('Course not found')
  return apiSuccess(course)
})
