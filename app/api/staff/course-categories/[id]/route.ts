import { NextRequest } from 'next/server'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiError, withErrorHandler , RouteContext } from '@/lib/api/response'
import { z } from 'zod'

const updateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().optional(),
})

export const PATCH = withErrorHandler(
  async (req: NextRequest, ctx?: RouteContext) => {
    await requireStaff()

    const id = (await ctx!.params).id
    if (!id) return apiError('Missing category ID', 400)

    const body = await req.json()
    const validated = updateSchema.safeParse(body)

    if (!validated.success) return apiError('Invalid category data')

    const { name, description } = validated.data

    // Check name uniqueness if being changed
    if (name) {
      const normalized = name.toUpperCase().replace(/\s+/g, '_')
      const existing = await prismaUnfiltered.courseCategory.findFirst({
        where: { name: normalized, NOT: { id } },
      })
      if (existing) return apiError('A category with this name already exists')
    }

    const category = await prismaUnfiltered.courseCategory.update({
      where: { id },
      data: {
        ...(name ? { name: name.toUpperCase().replace(/\s+/g, '_') } : {}),
        ...(description !== undefined ? { description } : {}),
      },
      include: { _count: { select: { courses: true } } },
    })

    return apiSuccess(category)
  }
)

export const DELETE = withErrorHandler(
  async (req: NextRequest, ctx?: RouteContext) => {
    await requireStaff()

    const id = (await ctx!.params).id
    if (!id) return apiError('Missing category ID', 400)

    // Block if courses are still assigned
    const courseCount = await prismaUnfiltered.course.count({ where: { categoryId: id } })
    if (courseCount > 0) {
      return apiError(
        `Cannot delete: ${courseCount} course(s) are still in this category. Reassign them first.`,
        409
      )
    }

    await prismaUnfiltered.courseCategory.delete({ where: { id } })

    return apiSuccess({ deleted: true })
  }
)
