import { NextRequest } from 'next/server'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { requireAdmin, getAuthSession } from '@/lib/auth/helpers'
import { apiSuccess, withErrorHandler, apiError } from '@/lib/api/response'
import { createAuditLog, AuditAction } from '@/lib/audit/logger'
import { revalidateTag } from 'next/cache'

export const GET = withErrorHandler(async (_req: NextRequest) => {
  await requireAdmin()
  const settings = await prismaUnfiltered.systemSetting.findMany({ orderBy: { key: 'asc' } })
  return apiSuccess(settings)
})

export async function POST(req: NextRequest) {
  const session = await getAuthSession()
  if (!session) return apiError('Unauthorized', 401)
  const staff = session.user

  try {
    const formData = await req.formData()
    const updates: { key: string; value: string; type: string }[] = []

    const fieldNames = new Set<string>()
    for (const [key] of formData.entries()) {
      if (key.endsWith('__type')) {
        fieldNames.add(key.replace('__type', ''))
      } else {
        fieldNames.add(key)
      }
    }

    for (const fieldName of fieldNames) {
      const type = (formData.get(`${fieldName}__type`) as string) ?? 'STRING'

      let value: string
      if (type === 'BOOLEAN') {
        const val = formData.get(fieldName)
        value = (val === 'on' || val === 'true') ? 'true' : 'false'
      } else {
        const val = formData.get(fieldName)
        if (val === null) continue
        value = (val as string).trim()
      }

      updates.push({ key: fieldName, value, type })
    }

    await Promise.all(
      updates.map(({ key, value, type }) =>
        prismaUnfiltered.systemSetting.upsert({
          where: { key },
          update: { value, updatedBy: session.user.id },
          create: { key, value, type },
        })
      )
    )

    await createAuditLog({
      action: AuditAction.SYSTEM_UPDATE,
      entity: 'SystemSetting',
      userId: staff.id,
      details: { updates },
    })

    revalidateTag('settings', 'max')

    // Return JSON when requested (client-side form submissions)
    const accept = req.headers.get('accept') || ''
    if (accept.includes('application/json')) {
      return apiSuccess({ saved: true, count: updates.length })
    }

    // Redirect back for native form submissions
    return new Response(null, {
      status: 303,
      headers: { Location: '/staff/settings?saved=1' },
    })
  } catch (error: unknown) {
    return apiError(error instanceof Error ? error.message : 'Failed to save settings', 500)
  }
}
