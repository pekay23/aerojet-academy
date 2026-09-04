import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { requireApplicant } from '@/lib/auth/helpers'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { updateProfileSchema, validateBody } from '@/lib/validation/schemas'

export const GET = withErrorHandler(async (_req: NextRequest) => {
  const user = await requireApplicant()
  const profile = await prisma.profile.findUnique({ where: { userId: user.id } })
  return apiSuccess(profile)
})

export const PATCH = withErrorHandler(async (req: NextRequest) => {
  const user = await requireApplicant()
  const body = await req.json()
  const validation = validateBody(updateProfileSchema, body)
  if (!validation.success) return apiError(validation.error)
  const profile = await prisma.profile.upsert({
    where: { userId: user.id },
    update: validation.data,
    create: { userId: user.id, firstName: 'Unknown', lastName: 'Unknown', ...validation.data },
  })
  return apiSuccess(profile)
})
