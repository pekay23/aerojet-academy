import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { requireAdmin, getAuthSession } from '@/lib/auth/helpers'
import { apiSuccess, withErrorHandler, apiError } from '@/lib/api/response'

export const GET = withErrorHandler(async (req: NextRequest) => {
  await requireAdmin()
  const { searchParams } = new URL(req.url)
  const group = searchParams.get('group')

  const where: any = {}
  if (group) where.group = group

  const settings = await prisma.systemSetting.findMany({ where, orderBy: { key: 'asc' } })
  return apiSuccess(settings)
})

export async function POST(req: NextRequest) {
  const session = await getAuthSession()
  if (!session) return apiError('Unauthorized', 401)

  try {
    const formData = await req.formData()
    const updates: { key: string; value: string; type: string }[] = []

    for (const [fieldName] of formData.entries()) {
      if (fieldName.endsWith('__type')) continue
      const type = (formData.get(`${fieldName}__type`) as string) ?? 'STRING'

      let value: string
      if (type === 'BOOLEAN') {
        value = formData.has(fieldName) ? 'true' : 'false'
      } else {
        value = ((formData.get(fieldName) as string) ?? '').trim()
      }

      updates.push({ key: fieldName, value, type })
    }

    await Promise.all(
      updates.map(({ key, value, type }) =>
        prisma.systemSetting.upsert({
          where: { key },
          update: { value, updatedBy: (session.user as any).id },
          create: { key, value, type },
        })
      )
    )

    // Redirect back with success message or just return success
    return new Response(null, {
      status: 303,
      headers: { Location: '/staff/settings?saved=1' },
    })
  } catch (error: any) {
    return apiError(error.message || 'Failed to save settings', 500)
  }
}
