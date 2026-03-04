import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { hashPassword } from '@/lib/auth/helpers'
import { createAuditLog, AuditAction } from '@/lib/audit/logger'

export const POST = withErrorHandler(async (req: NextRequest) => {
  let body: any
  try {
    body = await req.json()
  } catch (e) {
    return apiError('Invalid request body', 400)
  }

  const { token, password } = body

  if (!token || !password) {
    return apiError('Token and password are required', 400)
  }

  if (password.length < 8) {
    return apiError('Password must be at least 8 characters long', 400)
  }

  const user = await prisma.user.findFirst({
    where: {
      verifyToken: token,
      verifyTokenExpires: {
        gt: new Date(),
      },
    },
  })

  if (!user) {
    return apiError('Invalid or expired reset token', 400)
  }

  const hashedPassword = await hashPassword(password)

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      verifyToken: null,
      verifyTokenExpires: null,
      loginAttempts: 0,
      lockedUntil: null,
    },
  })

  await createAuditLog({
    action: AuditAction.UPDATE,
    entity: 'User',
    entityId: user.id,
    userId: user.id,
    description: 'Password successfully reset',
  })

  return apiSuccess({ message: 'Password reset successful' })
})
