import { NextRequest } from 'next/server'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { z } from 'zod'
import { CustomFieldType, CustomFieldTarget } from '@prisma/client'

const FIELD_TYPES = ['TEXT', 'NUMBER', 'DATE', 'SELECT', 'MULTI_SELECT', 'FILE', 'BOOLEAN'] as const
const FIELD_TARGETS = ['APPLICATION', 'STUDENT_PROFILE', 'USER'] as const

const schema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  fieldType: z.enum(FIELD_TYPES),
  options: z.any().optional(),
  appliesTo: z.enum(FIELD_TARGETS),
  isRequired: z.boolean().default(false),
  applicableProgrammes: z.array(z.string()).default([]),
  sortOrder: z.number().default(0),
  isActive: z.boolean().default(true)
})

export const GET = withErrorHandler(async (_req: NextRequest, _ctx: any) => {
  await requireStaff()
  const fields = await prismaUnfiltered.customFieldDefinition.findMany({
    orderBy: [{ appliesTo: 'asc' }, { sortOrder: 'asc' }]
  })
  return apiSuccess({ fields })
})

export const POST = withErrorHandler(async (req: NextRequest, _ctx: any) => {
  await requireStaff()
  const body = await req.json()
  const result = schema.safeParse(body)
  if (!result.success) return apiError('Invalid input')

  const field = await prismaUnfiltered.customFieldDefinition.create({
    data: result.data as any
  })

  return apiSuccess({ field })
})
