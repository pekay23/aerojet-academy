import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { withErrorHandler, apiSuccess } from '@/lib/api/response'
import { parsePagination } from '@/lib/api/response'

export const GET = withErrorHandler(async (req: NextRequest) => {
  const session = await getAuthSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const { limit, skip } = parsePagination(searchParams)

  const notifications = await prismaUnfiltered.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip,
  })

  return apiSuccess(notifications)
})

export const PATCH = withErrorHandler(async (req: NextRequest) => {
  const session = await getAuthSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { ids, dismissAll } = body as {
    ids?: string[]
    dismissAll?: boolean
  }

  if (dismissAll) {
    await prismaUnfiltered.notification.deleteMany({
      where: {
        userId: session.user.id,
        type: { not: 'CRITICAL' },
      },
    })
  } else if (ids && Array.isArray(ids)) {
    await prismaUnfiltered.notification.deleteMany({
      where: { id: { in: ids }, userId: session.user.id },
    })
  }

  return apiSuccess({ message: 'Notifications dismissed' })
})
