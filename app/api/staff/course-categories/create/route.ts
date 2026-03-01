import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { requireStaff } from '@/lib/auth/helpers'
import { apiCreated, apiError, withErrorHandler } from '@/lib/api/response'
import { z } from 'zod'

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

  const existing = await prisma.courseCategory.findUnique({
    where: { name },
  })

  if (existing) {
    return apiError('Category already exists')
  }

  const category = await prisma.courseCategory.create({
    data: {
      name: name.toUpperCase().replace(/\s+/g, '_'),
      description,
    },
  })

  return apiCreated(category)
})
