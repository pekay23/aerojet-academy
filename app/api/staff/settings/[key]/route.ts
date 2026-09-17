import { NextRequest } from 'next/server'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { requireAdmin } from '@/lib/auth/helpers'
import { apiSuccess, apiError, apiNotFound, withErrorHandler , RouteContext } from '@/lib/api/response'
import { AuditAction, createAuditLog } from '@/lib/audit/logger'

export const GET = withErrorHandler(
  async (req: NextRequest, ctx?: RouteContext) => {
    await requireAdmin()
    const setting = await prismaUnfiltered.systemSetting.findUnique({ where: { key: (await ctx!.params).key } })
    if (!setting) return apiNotFound('Setting not found')
    return apiSuccess(setting)
  }
)

export const PUT = withErrorHandler(
  async (req: NextRequest, ctx?: RouteContext) => {
    const admin = await requireAdmin()
    const body = await req.json()
    const { value, description } = body
    if (value === undefined) return apiError('Value is required')
    const key = (await ctx!.params).key!
    const existing = await prismaUnfiltered.systemSetting.findUnique({ where: { key } })

    const setting = await prismaUnfiltered.systemSetting.upsert({
      where: { key },
      update: { value, description, updatedBy: admin.id },
      create: { key, value, type: 'STRING', description, updatedBy: admin.id },
    })
    await createAuditLog({
      userId: admin.id,
      action: existing ? AuditAction.SYSTEM_UPDATE : AuditAction.CREATE,
      entity: 'SystemSetting',
      entityId: setting.id,
      description: `${existing ? 'Updated' : 'Created'} system setting "${key}".`,
      changes: {
        key,
        before: existing ? { value: existing.value, description: existing.description } : null,
        after: { value: setting.value, description: setting.description },
      },
    })
    return apiSuccess(setting)
  }
)
