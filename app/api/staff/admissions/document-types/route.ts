import { NextRequest } from 'next/server'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiCreated, apiError, withErrorHandler } from '@/lib/api/response'
import { z } from 'zod'

const createSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
  fileTypes: z.string().default('application/pdf,image/jpeg,image/png'),
  maxSizeMB: z.number().int().min(1).max(50).default(4),
  isRequired: z.boolean().default(true),
  applicableProgrammes: z.array(z.string()).default([]),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
})

// GET /api/staff/admissions/document-types
export const GET = withErrorHandler(async () => {
  await requireStaff()

  const types = await prismaUnfiltered.applicationDocumentType.findMany({
    orderBy: { sortOrder: 'asc' },
    take: 100,
    include: { _count: { select: { documents: true } } },
  })

  return apiSuccess(types)
})

// POST /api/staff/admissions/document-types
export const POST = withErrorHandler(async (req: NextRequest) => {
  await requireStaff()
  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return apiError(parsed.error.issues[0].message)

  const existing = await prismaUnfiltered.applicationDocumentType.findUnique({
    where: { slug: parsed.data.slug },
  })
  if (existing) return apiError('A document type with this slug already exists', 409)

  const docType = await prismaUnfiltered.applicationDocumentType.create({
    data: parsed.data as any,
  })

  return apiCreated(docType)
})
