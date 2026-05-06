import { NextRequest } from 'next/server'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, withErrorHandler } from '@/lib/api/response'

export const GET = withErrorHandler(async (req: NextRequest) => {
  await requireStaff()
  const { searchParams } = new URL(req.url)
  const query = searchParams.get('q')

  if (!query || query.length < 2) {
    return apiSuccess([])
  }

  const users = await prismaUnfiltered.user.findMany({
    where: {
      AND: [
        { role: 'STUDENT' }, // Only students
        {
          OR: [
            { email: { contains: query } }, // Case insensitive usually with default collation, but Prisma might vary
            {
              profile: {
                OR: [{ firstName: { contains: query } }, { lastName: { contains: query } }],
              },
            },
          ],
        },
      ],
    },
    select: {
      id: true,
      email: true,
      profile: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
      studentProfile: {
        select: {
          studentId: true,
        },
      },
    },
    take: 10,
  })

  return apiSuccess(users)
})

