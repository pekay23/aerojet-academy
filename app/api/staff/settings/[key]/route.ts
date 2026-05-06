import { NextRequest } from 'next/server'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { requireAdmin } from '@/lib/auth/helpers'
import { apiSuccess, apiError, apiNotFound, withErrorHandler } from '@/lib/api/response'

export const GET = withErrorHandler(
  async (req: NextRequest, ctx?: { params: Record<string, string> }) => {
    await requireAdmin()
    const setting = await prismaUnfiltered.systemSetting.findUnique({ where: { key: ctx?.params?.key } })
    if (!setting) return apiNotFound('Setting not found')
    return apiSuccess(setting)
  }
)

export const PUT = withErrorHandler(
  async (req: NextRequest, ctx?: { params: Record<string, string> }) => {
    const admin = await requireAdmin()
    const body = await req.json()
    const { value, description } = body
    if (value === undefined) return apiError('Value is required')

    const setting = await prismaUnfiltered.systemSetting.upsert({
      where: { key: ctx?.params?.key! },
      update: { value, description, updatedBy: admin.id },
      create: { key: ctx?.params?.key!, value, type: 'STRING', description, updatedBy: admin.id },
    })
    return apiSuccess(setting)
  }
)
