import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { requireApplicant } from '@/lib/auth/helpers'
import { apiSuccess, withErrorHandler } from '@/lib/api/response'

export const GET = withErrorHandler(async (req: NextRequest) => {
  await requireApplicant()
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')
  const where: any = { isActive: true }
  if (type) where.type = type
  const courses = await prisma.course.findMany({ where, orderBy: { code: 'asc' }, take: 200 })
  return apiSuccess(courses)
})

