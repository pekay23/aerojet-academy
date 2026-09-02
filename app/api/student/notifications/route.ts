import { NextRequest } from 'next/server'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { requireStudent } from '@/lib/auth/helpers'
import { apiSuccess, withErrorHandler } from '@/lib/api/response'
import { parsePagination } from '@/lib/api/response'

export const GET = withErrorHandler(async (req: NextRequest) => {
  const user = await requireStudent()
  const { searchParams } = new URL(req.url)
  const { limit, skip } = parsePagination(searchParams)

  const notifications = await prismaUnfiltered.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip,
  })
  return apiSuccess(notifications)
})

export const PATCH = withErrorHandler(async (req: NextRequest) => {
  const user = await requireStudent()
  const body = await req.json()
  const { ids } = body

  if (ids && Array.isArray(ids)) {
    await prismaUnfiltered.notification.updateMany({
      where: { id: { in: ids }, userId: user.id },
      data: { isRead: true, readAt: new Date() },
    })
  } else {
    // Mark all as read
    await prismaUnfiltered.notification.updateMany({
      where: { userId: user.id, isRead: false },
      data: { isRead: true, readAt: new Date() },
    })
  }
  return apiSuccess({ message: 'Notifications marked as read' })
})

