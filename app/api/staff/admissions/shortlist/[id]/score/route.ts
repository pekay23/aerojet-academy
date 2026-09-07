import { NextRequest } from 'next/server'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiError, withErrorHandler, RouteContext } from '@/lib/api/response'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { z } from 'zod'

const schema = z.object({
  experienceScore: z.number().min(0).max(100),
})

export const PUT = withErrorHandler(async (req: NextRequest, ctx?: RouteContext) => {
  await requireStaff()
  const { id } = (await ctx!.params) as { id: string }

  const body = await req.json()
  const result = schema.safeParse(body)
  if (!result.success) return apiError('Invalid experience score')

  const app = await prismaUnfiltered.application.findUnique({ where: { id } })
  if (!app) return apiError('Application not found', 404)

  const existingMeta: Record<string, unknown> = (app.metadata as Record<string, unknown>) || {}
  const newMeta = { ...existingMeta, experienceScore: result.data.experienceScore }

  await prismaUnfiltered.application.update({
    where: { id },
    data: { metadata: newMeta },
  })

  return apiSuccess({ updated: true })
})
