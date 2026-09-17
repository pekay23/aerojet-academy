import { NextRequest } from 'next/server'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiError, withErrorHandler, RouteContext } from '@/lib/api/response'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { z } from 'zod'
import { Prisma } from '@prisma/client'

const FIELD_TYPES = ['TEXT', 'NUMBER', 'DATE', 'SELECT', 'MULTI_SELECT', 'FILE', 'BOOLEAN'] as const
const FIELD_TARGETS = ['APPLICATION', 'STUDENT_PROFILE', 'USER'] as const

const schema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  fieldType: z.enum(FIELD_TYPES).optional(),
  options: z.any().optional(),
  appliesTo: z.enum(FIELD_TARGETS).optional(),
  isRequired: z.boolean().optional(),
  applicableProgrammes: z.array(z.string()).optional(),
  sortOrder: z.number().optional(),
  isActive: z.boolean().optional()
})

export const PUT = withErrorHandler(async (req: NextRequest, ctx: RouteContext) => {
  await requireStaff()
  const { id } = await ctx.params
  
  const body = await req.json()
  const result = schema.safeParse(body)
  if (!result.success) return apiError('Invalid input')

  const field = await prismaUnfiltered.customFieldDefinition.update({
    where: { id },
    data: result.data as Prisma.CustomFieldDefinitionUpdateInput
  })

  return apiSuccess({ field })
})

export const DELETE = withErrorHandler(async (_req: NextRequest, ctx: RouteContext) => {
  await requireStaff()
  const { id } = await ctx.params

  await prismaUnfiltered.customFieldDefinition.delete({
    where: { id }
  })

  return apiSuccess({ success: true })
})
