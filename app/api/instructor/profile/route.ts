import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { requireAuth, verifyPassword, hashPassword } from '@/lib/auth/helpers'
import { apiSuccess, apiForbidden, apiError, withErrorHandler } from '@/lib/api/response'
import { updateProfileSchema, changePasswordSchema, validateBody } from '@/lib/validation/schemas'
import { createAuditLog } from '@/lib/audit/logger'
import { UserRole } from '@prisma/client'

export const GET = withErrorHandler(async (req: NextRequest) => {
  const user = await requireAuth()
  if (user.role !== UserRole.INSTRUCTOR) return apiForbidden('Instructor access required')

  const [profile, instructorProfile] = await Promise.all([
    prisma.profile.findUnique({ where: { userId: user.id } }),
    prisma.instructorProfile.findUnique({ where: { userId: user.id } }),
  ])
  return apiSuccess({ profile, instructorProfile })
})

export const PATCH = withErrorHandler(async (req: NextRequest) => {
  const user = await requireAuth()
  if (user.role !== UserRole.INSTRUCTOR) return apiForbidden('Instructor access required')

  const body = await req.json()
  const validation = validateBody(updateProfileSchema, body)
  if (!validation.success) return apiError((validation as any).error)

  const profile = await prisma.profile.update({
    where: { userId: user.id },
    data: validation.data as any,
  })
  return apiSuccess(profile)
})
