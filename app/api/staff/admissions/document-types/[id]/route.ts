import { NextRequest } from 'next/server'
import type { Prisma } from '@prisma/client'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiError, apiNotFound, withErrorHandler } from '@/lib/api/response'
import { z } from 'zod'

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional().nullable(),
  fileTypes: z.string().optional(),
  maxSizeMB: z.number().int().min(1).max(50).optional(),
  isRequired: z.boolean().optional(),
  applicableProgrammes: z.array(z.string()).optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
})

type RouteContext = { params: Promise<{ id: string }> }

// GET /api/staff/admissions/document-types/[id]
export const GET = withErrorHandler(async (_req: NextRequest, ctx: RouteContext) => {
  await requireStaff()
  const { id } = await ctx.params

  const docType = await prismaUnfiltered.applicationDocumentType.findUnique({
    where: { id },
    include: { _count: { select: { documents: true } } },
  })
  if (!docType) return apiNotFound('Document type not found')

  return apiSuccess(docType)
})

// PUT /api/staff/admissions/document-types/[id]
export const PUT = withErrorHandler(async (req: NextRequest, ctx: RouteContext) => {
  await requireStaff()
  const { id } = await ctx.params
  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return apiError(parsed.error.issues[0].message)

  const existing = await prismaUnfiltered.applicationDocumentType.findUnique({ where: { id } })
  if (!existing) return apiNotFound('Document type not found')

  const updated = await prismaUnfiltered.applicationDocumentType.update({
    where: { id },
    data: parsed.data as Prisma.ApplicationDocumentTypeUpdateInput,
  })

  return apiSuccess(updated)
})

// DELETE /api/staff/admissions/document-types/[id]
export const DELETE = withErrorHandler(async (_req: NextRequest, ctx: RouteContext) => {
  await requireStaff()
  const { id } = await ctx.params

  const docType = await prismaUnfiltered.applicationDocumentType.findUnique({
    where: { id },
    include: { _count: { select: { documents: true } } },
  })
  if (!docType) return apiNotFound('Document type not found')
  if (docType._count.documents > 0) {
    return apiError('Cannot delete document type that has existing uploads. Deactivate it instead.')
  }

  await prismaUnfiltered.applicationDocumentType.delete({ where: { id } })
  return apiSuccess({ deleted: true })
})
