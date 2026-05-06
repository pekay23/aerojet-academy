import { NextRequest } from 'next/server'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { requireStaff } from '@/lib/auth/helpers'
import { apiCreated, apiError, withErrorHandler } from '@/lib/api/response'
import { z } from 'zod'
import { serializePrisma } from '@/lib/utils/serialization'

const categorySchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().optional(),
})

export const POST = withErrorHandler(async (req: NextRequest) => {
  const staff = await requireStaff()

  const body = await req.json()
  const validated = categorySchema.safeParse(body)

  if (!validated.success) {
    return apiError('Invalid category data')
  }

  const { name, description } = validated.data
  const normalizedName = name.trim().toUpperCase().replace(/\s+/g, '_')

  const existing = await prismaUnfiltered.courseCategory.findUnique({
    where: { name: normalizedName },
  })

  if (existing) {
    return apiError('Category already exists (normalized)')
  }

  const category = await prismaUnfiltered.courseCategory.create({
    data: {
      name: normalizedName,
      description,
    },
  })

  return apiCreated(serializePrisma(category))
})
