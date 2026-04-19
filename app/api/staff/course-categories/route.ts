import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, withErrorHandler } from '@/lib/api/response'
import { serializePrisma } from '@/lib/utils/serialization'

export const GET = withErrorHandler(async (req: NextRequest) => {
  await requireStaff()

  const categories = await prisma.courseCategory.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: { courses: true },
      },
    },
  })

  return apiSuccess(serializePrisma(categories))
})
