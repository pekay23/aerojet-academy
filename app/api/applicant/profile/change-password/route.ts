import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { requireApplicant, verifyPassword, hashPassword } from '@/lib/auth/helpers'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { changePasswordSchema, validateBody } from '@/lib/validation/schemas'
import { createAuditLog, AuditAction } from '@/lib/audit/logger'

export const POST = withErrorHandler(async (req: NextRequest) => {
  const user = await requireApplicant()
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
    data: {
      password: hashedPassword,
      mustChangePassword: false,
      passwordChanged: true,
      passwordChangedAt: new Date(),
    },
  })

  await createAuditLog({
    action: AuditAction.UPDATE,
    entity: 'User',
    entityId: user.id,
    userId: user.id,
    changes: { passwordChanged: true },
  })

  return apiSuccess({ message: 'Password changed successfully' })
})
