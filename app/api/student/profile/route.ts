import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { requireStudent } from '@/lib/auth/helpers'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { updateProfileSchema, validateBody } from '@/lib/validation/schemas'

export const GET = withErrorHandler(async (req: NextRequest) => {
  const user = await requireStudent()
  const [profile, studentProfile] = await Promise.all([
    prisma.profile.findUnique({ where: { userId: user.id } }),
    prisma.studentProfile.findUnique({ where: { userId: user.id } }),
  ])
  return apiSuccess({ profile, studentProfile })
})

export const PATCH = withErrorHandler(async (req: NextRequest) => {
  const user = await requireStudent()
  const body = await req.json()
  const validation = validateBody(updateProfileSchema, body)
  if (!validation.success) return apiError((validation as any).error)
  const profile = await prisma.profile.update({
    where: { userId: user.id },
    data: validation.data as any,
  })
  return apiSuccess(profile)
})

