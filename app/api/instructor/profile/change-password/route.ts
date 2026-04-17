import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { requireAuth, verifyPassword, hashPassword } from '@/lib/auth/helpers'
import { apiSuccess, apiForbidden, apiError, withErrorHandler } from '@/lib/api/response'
import { changePasswordSchema, validateBody } from '@/lib/validation/schemas'
import { createAuditLog, AuditAction } from '@/lib/audit/logger'
import { UserRole } from '@prisma/client'

export const POST = withErrorHandler(async (req: NextRequest) => {
  const user = await requireAuth()
  if (user.role !== UserRole.INSTRUCTOR) return apiForbidden('Instructor access required')

  const body = await req.json()
  const validation = validateBody(changePasswordSchema, body)
  if (!validation.success) return apiError(validation.error)

  const { currentPassword, newPassword } = validation.data

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
  if (!dbUser?.password) return apiError('No password set')

  const isValid = await verifyPassword(currentPassword, dbUser.password)
  if (!isValid) return apiError('Current password is incorrect')

  const hashedPassword = await hashPassword(newPassword)
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword, mustChangePassword: false, passwordChanged: true, passwordChangedAt: new Date() },
  })

  await createAuditLog({
    action: 'PASSWORD_CHANGE',
    entity: 'User',
    entityId: user.id,
    userId: user.id,
  })

  return apiSuccess({ message: 'Password changed successfully' })
})
