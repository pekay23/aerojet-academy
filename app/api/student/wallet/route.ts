import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { requireStudent } from '@/lib/auth/helpers'
import { apiSuccess, apiNotFound, withErrorHandler } from '@/lib/api/response'

export const GET = withErrorHandler(async (req: NextRequest) => {
  const user = await requireStudent()
  const wallet = await prisma.wallet.findUnique({ where: { userId: user.id } })
  if (!wallet) return apiNotFound('Wallet not found')
  return apiSuccess(wallet)
})

